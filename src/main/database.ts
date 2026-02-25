/**
 * Database Module
 * Handles MySQL database connections and queries for the Electron app
 *
 * All functions return data directly or throw errors
 * Error handling is done in IPC handlers in main.ts
 */

import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

// Lazily created pool — initialized after dotenv has loaded env vars
let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function initializePool(): Promise<void> {
  const connection = await getPool().getConnection();
  console.log('✅ Database connection established successfully');
  connection.release();
}

/**
 * ===========================
 * CONFIGURATIONS
 * ===========================
 */

/**
 * Get configuration
 */
export async function getConfigurations() {
  const [rows] = await getPool().execute(
    "SELECT fed_auth_section, qc_auth_section, summary_section FROM configurations WHERE id = '1' LIMIT 1",
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/**
 * Update configuration
 */
export async function updateConfigurations(config: {
  fed_auth_section: any;
  qc_auth_section: any;
  summary_section: any;
}) {
  await getPool().execute(
    `UPDATE configurations
     SET fed_auth_section = ?,
         qc_auth_section = ?,
         summary_section = ?
     WHERE id = '1'`,
    [
      JSON.stringify(config.fed_auth_section),
      JSON.stringify(config.qc_auth_section),
      JSON.stringify(config.summary_section),
    ],
  );
  return config;
}

/**
 * ===========================
 * TAX RATES
 * ===========================
 */

/**
 * Get all tax rates
 */
export async function getAllTaxRates() {
  const [rows] = await getPool().execute(
    'SELECT province, fedRate, provRate FROM tax_rates ORDER BY province ASC',
  );
  return rows;
}

/**
 * Get tax rate by province
 */
export async function getTaxRateByProvince(province: string) {
  const [rows] = await getPool().execute(
    'SELECT province, fedRate, provRate FROM tax_rates WHERE province = ? LIMIT 1',
    [province],
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/**
 * Bulk replace tax rates (delete all + insert new)
 */
export async function bulkReplaceTaxRates(
  rates: Array<{ province: string; fedRate: number; provRate: number }>,
) {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    // Delete all existing tax rates (except dummy record with province=0)
    await connection.execute("DELETE FROM tax_rates WHERE province != '0'");

    // Filter out empty provinces and trim them
    const validRates = rates
      .filter((rate) => rate.province && rate.province.trim() !== '')
      .map((rate) => ({
        ...rate,
        province: rate.province.trim(),
      }));

    // Remove duplicates by province (keep first occurrence) - compare trimmed values
    const seenProvinces = new Set<string>();
    const uniqueRates = validRates.filter((rate) => {
      const provinceUpper = rate.province.toUpperCase();
      if (seenProvinces.has(provinceUpper)) {
        return false;
      }
      seenProvinces.add(provinceUpper);
      return true;
    });

    // Insert new tax rates
    if (uniqueRates.length > 0) {
      const insertQuery =
        'INSERT INTO tax_rates (province, fedRate, provRate) VALUES (?, ?, ?)';

      for (const rate of uniqueRates) {
        // Triple-check province is not empty and is valid before inserting
        const province = rate.province?.trim();
        if (!province || province === '' || province === '0') {
          continue; // Skip empty or invalid provinces
        }

        // Ensure fedRate and provRate are valid numbers
        const fedRate = Number(rate.fedRate);
        const provRate = Number(rate.provRate);

        if (isNaN(fedRate) || isNaN(provRate)) {
          continue; // Skip invalid rates
        }

        try {
          await connection.execute(insertQuery, [province, fedRate, provRate]);
        } catch (insertError: any) {
          // If it's a duplicate key error, skip this entry
          if (
            insertError.code === 'ER_DUP_ENTRY' ||
            insertError.message?.includes('Duplicate entry')
          ) {
            console.warn(
              `Skipping duplicate province: ${province}`,
              insertError.message,
            );
            continue;
          }
          // Re-throw other errors
          throw insertError;
        }
      }
    }

    await connection.commit();
    return uniqueRates;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * ===========================
 * PRICE LIST
 * ===========================
 */

/**
 * Get all prices
 */
export async function getAllPrices() {
  // Always try to order by sort_order first, then by id as fallback
  // This ensures consistent ordering
  try {
    const [rows] = await getPool().execute(
      'SELECT id, service, amount, type, COALESCE(sort_order, 999999) as sort_order FROM price_list ORDER BY sort_order ASC, id ASC',
    );
    return rows;
  } catch (error: any) {
    // If sort_order column doesn't exist yet, order by id
    if (error.code === 'ER_BAD_FIELD_ERROR' || error.message?.includes('sort_order')) {
      const [rows] = await getPool().execute(
        'SELECT id, service, amount, type FROM price_list ORDER BY id ASC',
      );
      return rows;
    }
    throw error;
  }
}

/**
 * Bulk replace prices (delete all + insert new)
 */
export async function bulkReplacePrices(
  prices: Array<{ service: { en: string; fr: string }; amount: number; type: string }>,
) {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    // VALIDATE FIRST before deleting anything!
    const validPrices = prices.filter((price) => {
      // Check if service exists and has valid en/fr strings
      if (
        !price.service ||
        typeof price.service !== 'object' ||
        !price.service.en?.trim() ||
        !price.service.fr?.trim()
      ) {
        return false;
      }

      // Check if amount is a valid number
      if (isNaN(price.amount) || price.amount === null || price.amount === undefined) {
        return false;
      }

      // Check if type is valid
      if (!price.type || (price.type !== 'number' && price.type !== '%')) {
        return false;
      }

      return true;
    });

    // Only proceed if we have valid prices to insert
    if (validPrices.length === 0) {
      await connection.rollback();
      throw new Error('No valid prices to save. Please ensure all prices have valid service names (EN and FR), amount, and type.');
    }

    // Check if sort_order column exists - this is CRITICAL for preserving order
    let hasSortOrder = false;
    try {
      await connection.execute('SELECT sort_order FROM price_list LIMIT 1');
      hasSortOrder = true;
    } catch {
      hasSortOrder = false;
    }

    // Prepare all inserts first to ensure they're all valid
    // Note: id is char(36) UUID, so we need to generate UUIDs
    // IMPORTANT: Insert in the order provided to preserve sort order
    const insertQuery = hasSortOrder
      ? 'INSERT INTO price_list (id, sort_order, service, amount, type) VALUES (?, ?, ?, ?, ?)'
      : 'INSERT INTO price_list (id, service, amount, type) VALUES (?, ?, ?, ?)';

    const inserts: Array<[string, number, string, number, string] | [string, string, number, string]> = [];

    // Process prices in the EXACT order from the array (preserves drag-and-drop order)
    // The array index IS the sort_order - this ensures consistent ordering
    for (let index = 0; index < validPrices.length; index++) {
      const price = validPrices[index];
      // Double-check everything is valid
      const en = price.service.en?.trim();
      const fr = price.service.fr?.trim();
      const amount = Number(price.amount);
      const type = price.type;

      if (!en || !fr || isNaN(amount) || !type) {
        await connection.rollback();
        throw new Error(
          `Invalid price data: service names and amount must be valid. Your data has been restored.`,
        );
      }

      const serviceJson = JSON.stringify({ en, fr });

      // Validate JSON is not empty
      if (!serviceJson || serviceJson === '{}' || serviceJson === 'null') {
        await connection.rollback();
        throw new Error(
          `Invalid service data. Your data has been restored.`,
        );
      }

      // Generate UUID for id column (char(36))
      const uuid = randomUUID();

      // Use index as sort_order to preserve the drag-and-drop order
      if (hasSortOrder) {
        inserts.push([uuid, index, serviceJson, amount, type]);
      } else {
        inserts.push([uuid, serviceJson, amount, type]);
      }
    }

    // NOW delete all existing prices (only after validation passed)
    await connection.execute('DELETE FROM price_list');

    // Insert all new prices in order (preserves drag-and-drop order)
    for (let i = 0; i < inserts.length; i++) {
      try {
        let uuid: string;
        let serviceJson: string;
        let amount: number;
        let type: string;

        if (hasSortOrder) {
          [uuid, , serviceJson, amount, type] = inserts[i] as [string, number, string, number, string];
        } else {
          [uuid, serviceJson, amount, type] = inserts[i] as [string, string, number, string];
        }

        // Final validation before insert
        if (!uuid || uuid.length !== 36) {
          throw new Error(`Invalid UUID at index ${i}`);
        }
        if (!serviceJson || serviceJson === '{}' || serviceJson === 'null') {
          throw new Error(`Invalid service JSON at index ${i}`);
        }
        if (isNaN(amount)) {
          throw new Error(`Invalid amount at index ${i}`);
        }
        if (!type || (type !== 'number' && type !== '%')) {
          throw new Error(`Invalid type at index ${i}`);
        }

        // Use the sort_order from the inserts array (already set to index)
        if (hasSortOrder) {
          const [, sortOrder] = inserts[i] as [string, number, string, number, string];
          await connection.execute(insertQuery, [uuid, sortOrder, serviceJson, amount, type]);
        } else {
          await connection.execute(insertQuery, [uuid, serviceJson, amount, type]);
        }
      } catch (insertError: any) {
        // If there's an error during insert, rollback to restore data
        await connection.rollback();
        console.error('Insert error details:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          sqlState: insertError.sqlState,
          index: i,
          serviceJson,
          amount,
          type,
        });
        throw new Error(
          `Failed to insert price at position ${i + 1}: ${insertError.message || insertError.code || 'Unknown error'}. Your data has been restored.`,
        );
      }
    }

    await connection.commit();
    return validPrices;
  } catch (error) {
    // Rollback on any error to restore data
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * ===========================
 * INVOICE NUMBER
 * ===========================
 */

/**
 * Get current invoice number
 */
export async function getInvoiceNumber() {
  const [rows] = await getPool().execute(
    'SELECT invoices FROM invoice_number LIMIT 1',
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/**
 * Update invoice number
 */
export async function updateInvoiceNumber(invoiceNum: number) {
  await getPool().execute('UPDATE invoice_number SET invoices = ?', [invoiceNum]);
  return { invoices: invoiceNum };
}

/**
 * ===========================
 * USERS
 * ===========================
 */

/**
 * Verify admin password
 */
export async function verifyPassword(password: string) {
  const [rows] = await getPool().execute(
    "SELECT password FROM users WHERE username = 'admin' LIMIT 1",
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Admin user not found');
  }

  const user = rows[0] as { password: string };

  // Compare passwords (plain text as per current implementation)
  const verified = user.password === password;

  if (!verified) {
    throw new Error('Invalid password');
  }

  return { verified: true };
}

/**
 * Update admin password
 */
export async function updatePassword(
  oldPassword: string,
  newPassword: string,
) {
  // First verify old password
  const [rows] = await getPool().execute(
    "SELECT password FROM users WHERE username = 'admin' LIMIT 1",
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Admin user not found');
  }

  const user = rows[0] as { password: string };

  // Verify old password
  if (user.password !== oldPassword) {
    throw new Error('Current password is incorrect');
  }

  // Update to new password
  await getPool().execute("UPDATE users SET password = ? WHERE username = 'admin'", [
    newPassword,
  ]);

  return { updated: true };
}

/**
 * ===========================
 * EMAIL TEMPLATES
 * ===========================
 */

/**
 * Get all email templates
 */
export async function getAllEmailTemplates() {
  const [rows] = await getPool().execute(
    'SELECT id, template_name, subject_en, subject_fr, content_en, content_fr, created_at, updated_at FROM email_templates ORDER BY template_name ASC',
  );
  return rows;
}

/**
 * Get email template by ID
 */
export async function getEmailTemplateById(id: number) {
  const [rows] = await getPool().execute(
    'SELECT id, template_name, subject_en, subject_fr, content_en, content_fr, created_at, updated_at FROM email_templates WHERE id = ? LIMIT 1',
    [id],
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/**
 * Get email template by name
 */
export async function getEmailTemplateByName(templateName: string) {
  const [rows] = await getPool().execute(
    'SELECT id, template_name, subject_en, subject_fr, content_en, content_fr, created_at, updated_at FROM email_templates WHERE template_name = ? LIMIT 1',
    [templateName],
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/**
 * Create new email template
 */
export async function createEmailTemplate(template: {
  template_name: string;
  subject_en: string;
  subject_fr: string;
  content_en: string;
  content_fr: string;
}) {
  const [result] = await getPool().execute(
    'INSERT INTO email_templates (template_name, subject_en, subject_fr, content_en, content_fr) VALUES (?, ?, ?, ?, ?)',
    [
      template.template_name,
      template.subject_en,
      template.subject_fr,
      template.content_en,
      template.content_fr,
    ],
  );

  const insertResult = result as { insertId: number };
  return { id: insertResult.insertId, ...template };
}

/**
 * Update email template
 */
export async function updateEmailTemplate(
  id: number,
  template: {
    template_name: string;
    subject_en: string;
    subject_fr: string;
    content_en: string;
    content_fr: string;
  },
) {
  await getPool().execute(
    'UPDATE email_templates SET template_name = ?, subject_en = ?, subject_fr = ?, content_en = ?, content_fr = ? WHERE id = ?',
    [
      template.template_name,
      template.subject_en,
      template.subject_fr,
      template.content_en,
      template.content_fr,
      id,
    ],
  );
  return { id, ...template };
}

/**
 * Delete email template
 */
export async function deleteEmailTemplate(id: number) {
  await getPool().execute('DELETE FROM email_templates WHERE id = ?', [id]);
  return { deleted: true };
}

/**
 * Close database connection pool
 * Call this when app is shutting down
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }
}
