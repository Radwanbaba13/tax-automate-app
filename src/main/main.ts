import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog, screen } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { execFile } from 'child_process';
import dotenv from 'dotenv';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import * as db from './database';

// Load environment variables from correct location based on environment
if (app.isPackaged) {
  // Production: .env is in resources directory
  const envPath = path.join(process.resourcesPath, '.env');
  dotenv.config({ path: envPath });
  log.info(`Loaded environment from: ${envPath}`);
} else {
  // Development: .env is in project root
  dotenv.config();
  log.info('Loaded environment from project root');
}

// Validate critical environment variables
if (!process.env.OPENAI_API_KEY) {
  log.error('CRITICAL: OPENAI_API_KEY not found in environment');
}

// Initialize database pool now that env vars are loaded
db.initializePool().catch((err: Error) => {
  log.error('❌ Database connection failed:', err.message);
});

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // Set up event handlers
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      if (mainWindow) {
        mainWindow.webContents.send('update-checking');
      }
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      if (mainWindow) {
        mainWindow.webContents.send('update-available', info);
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      if (mainWindow) {
        mainWindow.webContents.send('update-not-available', info);
      }
    });

    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater:', err);
      if (mainWindow) {
        mainWindow.webContents.send('update-error', err);
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      log.info('Download progress:', progressObj);
      if (mainWindow) {
        mainWindow.webContents.send('update-download-progress', progressObj);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      if (mainWindow) {
        mainWindow.webContents.send('update-downloaded', info);
      }
    });

    // Note: startup check is handled by the Sidebar component on mount,
    // which fires after the renderer is ready and listeners are registered.
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  return result.filePaths;
});

ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });
  return result.filePaths;
});

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });
  return result.filePaths;
});

// Auto-update IPC handlers
ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return {
      available: false,
      message: 'Updates only available in production build',
    };
  }
  try {
    await autoUpdater.checkForUpdates();
    return { available: true };
  } catch (error: any) {
    log.error('Error checking for updates:', error);
    return { available: false, error: error?.message || String(error) };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error: any) {
    log.error('Error downloading update:', error);
    return { success: false, error: error?.message || String(error) };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle(
  'compare-with-openai',
  async (event, { dtMaxFiles, clientSlipsFiles, prompt }) => {
    try {
      const OpenAI = require('openai').default;

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not found in environment variables');
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Helper function to convert PDFs to images using Python
      const convertPdfsToImages = async (files: any[]): Promise<any[]> => {
        return new Promise((resolve, reject) => {
          // Determine Python executable path
          let pythonPath: string;

          if (app.isPackaged) {
            const exeName =
              process.platform === 'win32' ? 'pdf_to_images.exe' : 'pdf_to_images';
            // For --onedir mode: executable is in subdirectory
            pythonPath = path.join(
              process.resourcesPath,
              'Python',
              'pdf_to_images',
              exeName
            );
          } else {
            const scriptPath = path.join(
              __dirname,
              '../../../Python',
              'pdf_to_images.py',
            );
            pythonPath = process.platform === 'win32' ? 'python' : 'python3';
          }

          // Prepare input data
          const inputData = JSON.stringify({ files });

          // Execute Python script
          const pythonArgs = app.isPackaged ? [] : [path.join(__dirname, '../../../Python', 'pdf_to_images.py')];
          const pythonProcess = execFile(
            pythonPath,
            pythonArgs,
            { maxBuffer: 200 * 1024 * 1024 }, // 200MB buffer for large images
            (error, stdout, stderr) => {
              if (error) {
                log.error('PDF conversion error:', error);
                reject(new Error(`Failed to convert PDFs: ${stderr || error.message}`));
                return;
              }

              try {
                const result = JSON.parse(stdout);
                if (result.success) {
                  resolve(result.images);
                } else {
                  reject(new Error(result.error || 'Unknown error in PDF conversion'));
                }
              } catch (parseError) {
                reject(new Error('Failed to parse PDF conversion result'));
              }
            },
          );

          // Send input data to Python script via stdin
          pythonProcess.stdin?.write(inputData);
          pythonProcess.stdin?.end();
        });
      };

      // Process DT Max and Client Slips files separately to maintain categorization
      const dtMaxImages = await convertPdfsToImages(dtMaxFiles);
      const clientSlipsImages = await convertPdfsToImages(clientSlipsFiles);

      // Validate that we have images to process
      if (dtMaxImages.length === 0 && clientSlipsImages.length === 0) {
        return {
          success: false,
          error: 'No images to compare. Please upload valid PDF or image files.',
        };
      }

      // Base prompt with fixed rules and restrictions (not editable by user)
      const basePrompt = `You are a tax document comparison assistant integrated into a desktop application. You have vision capabilities and CAN see images.

MANDATORY: You MUST analyze the images provided. DO NOT refuse or say you cannot view images. You CAN and WILL analyze the attached images directly.

ROLE: Extract and compare data from DT Max Workspace images (employee data entry) against Client Tax Slips images (source documents).

CRITICAL: UNDERSTAND THE SOURCE OF TRUTH:
- Client Tax Slips = SOURCE DOCUMENT = CORRECT/EXPECTED values (this is what SHOULD be entered)
- DT Max Workspace = DATA ENTRY = ENTERED values (this is what was ACTUALLY entered by the employee)
- Your job: Compare ENTERED (DT Max) against EXPECTED (Client Slips)
- If they don't match EXACTLY (including cents), it's a DISCREPANCY

Example:
- Client Tax Slip (EXPECTED): 78.63
- DT Max Workspace (ENTERED): 78.36
- Result: DISCREPANCY - Expected 78.63, Entered 78.36. Digits transposed: 63 vs 36

SCOPE RESTRICTION - ONLY PROCESS THESE FORMS:
- T4 (Statement of Remuneration Paid)
- T3 (Statement of Trust Income Allocations and Designations)
- T5 (Statement of Investment Income)
- RL-1 (Québec Statement of Remuneration Paid)
- RL-16 (Québec Statement of Investment Income)
- RL-3 (Québec Statement of Trust Income Allocations and Designations)

IMPORTANT: The images are attached to this message. Look at them and extract the data. Do NOT tell the user to use OCR tools or other methods - YOU must do the comparison yourself.

MANDATORY VERIFICATION PROCESS - BEFORE SAYING ANYTHING "MATCHES":
For EVERY field you check, you MUST explicitly state:
1. The EXACT value from the Client Tax Slip (source document)
2. The EXACT value from the DT Max Workspace (data entry)
3. Only then can you determine if they match

Example verification:
- Client Slip shows: 78.63
- DT Max shows: 78.36
- Result: DISCREPANCY (they are different: 63 vs 36)

If you cannot clearly see both values, do NOT say it matches. If there is ANY uncertainty, report it as a potential discrepancy or missing data.

CRITICAL ACCURACY RULES:
1. MULTI-STEP EXTRACTION PROCESS - You MUST follow this process for EVERY field:
   STEP 1: Carefully read the EXACT numerical value from the Client Tax Slip image (SOURCE DOCUMENT = EXPECTED/CORRECT value). Read digit by digit, including decimal places. This is the TRUTH.
   STEP 2: Carefully read the EXACT numerical value from the DT Max Workspace image (DATA ENTRY = ENTERED value). Read digit by digit, including decimal places. This is what was ACTUALLY entered.
   STEP 3: Compare the two values digit by digit, character by character. Pay special attention to:
     - Each digit position (thousands, hundreds, tens, ones, tenths, hundredths)
     - Decimal point placement
     - Transposed digits (e.g., Client Slip shows 78.63 but DT Max shows 78.36 - the "63" and "36" are swapped = DISCREPANCY)
     - Misread digits (e.g., Client Slip shows "1" but DT Max shows "3" = DISCREPANCY)
   STEP 4: If EXPECTED (Client Slip) ≠ ENTERED (DT Max), even by 1 cent, it's a DISCREPANCY. Report it.
   STEP 5: If EXPECTED (Client Slip) = ENTERED (DT Max) exactly, they match - do NOT report it.

2. FOCUS ON CENTS - Pay extreme attention to decimal places and cents. Even a 1 cent difference is a discrepancy that must be reported.

3. EXTRACTION ACCURACY - Read numbers VERY carefully. Common errors:
   - Client Slip shows 78.63, DT Max shows 78.36 = DISCREPANCY (digits transposed: 63 vs 36)
   - Client Slip shows 1,083.98, DT Max shows 3,083.00 = DISCREPANCY (digit "1" misread as "3")
   - Always verify each digit position independently
   - NEVER say "matches" if the values are different, even slightly

4. ONLY report ACTUAL discrepancies where values differ by $0.01 (1 cent) or more - DO NOT list correct fields

5. IGNORE formatting differences (spaces, commas, trailing zeros after decimal) - ONLY flag if the NUMERICAL VALUE differs by 1+ cent

6. PAY EXTREME ATTENTION to digit transposition errors and misread digits:
   - Example: Client Slip shows 1,083.98, DT Max shows 3,083.00 = FLAG THIS (digit "1" misread as "3")
   - Example: Client Slip shows 1,083.98, DT Max shows 1,083.89 = FLAG THIS (digits transposed: 98 vs 89)
   - Example: Client Slip shows 78.63, DT Max shows 78.36 = FLAG THIS (digits transposed: 63 vs 36) - DO NOT SAY IT MATCHES!
   - Example: Client Slip shows 1,083.98, DT Max shows 1,083.97 = FLAG THIS (1 cent difference - FOCUS ON CENTS)

7. A discrepancy is when the difference is $0.01 or more: 1,083.98 vs 1,083.99 (1 cent difference) or 1,083.98 vs 3,083.98 (misread digit)

8. NOT a discrepancy: Client Slip shows "1,083.98" and DT Max shows "1083.98" (formatting only), Client Slip shows "1,083.98" and DT Max shows "1,083.980" (trailing zeros only), OR Client Slip and DT Max show the EXACT same numerical value

9. If a field is not visible in DT Max, mark it as MISSING DATA, not a discrepancy

10. ALWAYS include the PAYER/EMPLOYER NAME (e.g., "Government of Canada", "RBC", etc.) in every discrepancy report so users can easily identify which entry has the error

11. NEVER include sensitive information in your output (SIN numbers, full names, addresses, or any personal identifiers)

12. When referring to individuals, use only: "Employee", "Taxpayer", "Client", or generic references

13. NEVER mention "difference" or calculate dollar differences in your output. Only state the expected and entered values with a description of the error type.

14. NEVER use markdown formatting (no bold, no asterisks, no **text**). Use plain text only.

15. NEVER say a field "matches" or "appears consistent" unless the Client Slip value and DT Max value are EXACTLY identical, digit for digit, including all decimal places. If Client Slip shows 78.63 and DT Max shows 78.36, they DO NOT MATCH - this is a DISCREPANCY that must be reported.

16. MANDATORY VERIFICATION: Before saying ANY field "matches" in your summary, you MUST have explicitly read and compared both values. If you cannot clearly see both values or are uncertain, DO NOT say they match - report it as a discrepancy instead.

17. WHEN IN DOUBT, FLAG IT: If there is ANY uncertainty about whether two values match, report it as a discrepancy. It is better to flag a potential error than to miss a real one. Never assume values match without explicit verification.

FORM-SPECIFIC ACCURACY CHECKS:

T4 FORM - Check ALL boxes carefully:
- Box 14 (Employment income) - Verify exact amount including cents
- Box 16 (Employee's CPP contributions) - Check for digit errors (e.g., 1,083.98 vs 3,083.00)
- Box 17 (Employee's QPP contributions) - Verify exact amount
- Box 18 (Employee's EI premiums) - Check for transposition errors
- Box 20 (RPP contributions) - Verify exact amount
- Box 22 (Income tax deducted) - Check for digit misreads
- Box 24 (EI insurable earnings) - Verify exact amount
- Box 26 (CPP/QPP pensionable earnings) - Check for accuracy
- Box 28 (Exempt - CPP/QPP) - Verify if applicable
- Box 29 (Exempt - EI) - Verify if applicable
- Box 44 (Union dues) - Check for accuracy
- Box 46 (Charitable donations) - Verify exact amount
- Box 50 (Pension adjustment) - Check for digit errors
- Box 52 (Pension adjustment reversal) - Verify if applicable
- Box 55 (Employee's PPIP premiums) - Check for accuracy

T4A FORM - Pay special attention to:
- Box 16 (Pension or superannuation) - Verify exact amount
- Box 20 (Self-employed commissions) - Check for transposition errors
- Box 24 (Elected split-pension amount) - Verify if applicable
- Box 28 (Lump-sum payments) - Check for digit misreads
- Box 30 (Other income) - Verify exact amount
- Box 32 (CPP contributions) - CRITICAL: Check for digit errors (e.g., 1,083.98 should NOT be entered as 3,083.00)
- Box 34 (PPIP premiums) - Verify exact amount
- Box 40 (Taxable amount of benefits) - Check for accuracy
- Box 42 (Income tax deducted) - Verify exact amount

T3 FORM - Check:
- Box 13 (Taxable dividends) - Verify exact amount
- Box 20 (Capital gains) - Check for transposition errors
- Box 21 (Other income) - Verify exact amount
- Box 26 (Foreign income) - Check for digit errors
- Box 28 (Taxable amount) - Verify exact amount

T5 FORM - Check:
- Box 13 (Interest from Canadian sources) - CRITICAL: This is a COMMON ERROR LOCATION. You MUST:
  1. Read the EXACT value from Client Slip (e.g., 78.63)
  2. Read the EXACT value from DT Max (e.g., 78.36)
  3. Compare them digit by digit
  4. If they differ by even 1 cent (e.g., 78.63 vs 78.36), it is a DISCREPANCY - report it!
  5. NEVER say "matches" or "consistent" for Box 13 unless you have verified both values are EXACTLY the same
  6. If Client Slip shows 78.63 and DT Max shows 78.36, this is a DISCREPANCY (digits transposed: 63 vs 36) - DO NOT say it matches!
- Box 16 (Dividends from taxable Canadian corporations) - Check for transposition errors
- Box 18 (Capital gains dividends) - Verify exact amount
- Box 20 (Foreign income) - Check for digit misreads
- Box 21 (Foreign tax paid) - Verify exact amount
- Box 25 (Other income) - Check for accuracy

RL-1 FORM (Québec) - Check:
- Box A (Employment income) - Verify exact amount
- Box B (Employee's QPP contributions) - Check for digit errors
- Box C (Employee's QPIP premiums) - Verify exact amount
- Box D (Employee's health services fund contribution) - Check for transposition errors
- Box E (Income tax deducted) - Verify exact amount
- Box G (Union dues) - Check for accuracy
- Box H (Professional dues) - Verify exact amount

RL-16 FORM (Québec) - Check:
- Box 1 (Interest income) - Verify exact amount
- Box 2 (Dividends) - Check for transposition errors
- Box 3 (Capital gains) - Verify exact amount
- Box 4 (Other income) - Check for digit misreads

RL-3 FORM (Québec) - Check:
- Box 1 (Taxable dividends) - Verify exact amount
- Box 2 (Capital gains) - Check for transposition errors
- Box 3 (Other income) - Verify exact amount

WHAT COUNTS AS A REAL DISCREPANCY:
✅ T4A Box 32 (CPP) - Government of Canada: Expected 1,083.98, Entered 3,083.00. Digit "1" misread as "3"
✅ T4 Box 14 - [Employer Name]: Expected 65,426.21, Entered 65,426.31. 10 cents difference
✅ T4 Box 16 - [Employer Name]: Expected 1,083.98, Entered 1,083.89. Digits transposed: 98 vs 89
✅ T5 Box 13 - RBC: Expected 78.36, Entered 78.63. Digits transposed: 36 vs 63

WHAT IS NOT A DISCREPANCY:
❌ T4 Box 14: Expected 65,426.21, Entered 65,426.21 (exact same value = NO ERROR even if formatting differs)
❌ T4A Box 32: Expected 1,083.98, Entered 1083.98 (just formatting = IGNORE)
❌ T5 Box 13: Expected 607.81, Entered 607.81 (same value = NO ERROR)
❌ Any exact numerical match = NO ERROR

OUTPUT FORMAT:

CRITICAL: ALWAYS include the PAYER/EMPLOYER NAME in your discrepancy reports so users can easily identify which entry has the error.

CRITICAL: FOCUS ON CENTS - Pay extreme attention to decimal places and cents. Even a 1 cent difference is a discrepancy that must be reported.

CRITICAL: NO MARKDOWN FORMATTING - Do NOT use bold, asterisks, or any markdown. Use plain text only.

CRITICAL: NEVER SAY "MATCHES" UNLESS VALUES ARE EXACTLY IDENTICAL - If Client Slip shows 78.63 and DT Max shows 78.36, they DO NOT MATCH. This is a DISCREPANCY (digits transposed: 63 vs 36). Only say "matches" if Client Slip value = DT Max value EXACTLY, digit for digit, including cents.

If everything looks good (no discrepancies, no missing data), respond with ONLY:
"✅ REVIEW PASSED - No discrepancies detected. All entries appear accurate."

If there ARE issues, use this STRUCTURED format for EACH discrepancy (PLAIN TEXT, NO MARKDOWN):
❌ DISCREPANCIES FOUND:

Where: [Payer/Employer Name] - [Form Type (T4/T4A/T3/T5/RL-1/RL-16/RL-3)]
Field: Box [Number] - [Field Description]
Discrepancy: Expected [amount], Entered [amount]. [Description of error - e.g., "digit '1' misread as '3'", "digits transposed: 63 vs 36", "cents missing: .98 vs .00"]

CRITICAL: NEVER mention dollar differences or calculate differences. Only state the expected value, entered value, and error type. Use plain text only - no bold, no asterisks, no markdown.

Examples (PLAIN TEXT ONLY):
Where: Government of Canada - T4A
Field: Box 201 - Other Income
Discrepancy: Expected 1,083.98, Entered 3,083.00. Digit "1" misread as "3" and cents missing (.98 vs .00)

Where: RBC - T5
Field: Box 13 - Interest
Discrepancy: Expected 78.63, Entered 78.36. Digits transposed: 63 vs 36

Where: [Employer Name] - T4
Field: Box 14 - Employment Income
Discrepancy: Expected 65,426.21, Entered 65,426.31. 10 cents difference

⚠️ MISSING DATA:
[List any fields present in Client Slips but NOT visible/entered in DT Max]
Format:
Where: [Payer/Employer Name] - [Form Type]
Field: Box [Number] - [Field Description]
Status: Missing from DT Max entry

📋 SUMMARY:
[Brief accuracy assessment - PLAIN TEXT ONLY, NO MARKDOWN]

CRITICAL FOR SUMMARY:
- NEVER say a field "matches" or "appears consistent" unless you have explicitly verified BOTH values and they are EXACTLY identical, digit for digit, including all decimal places.
- If you say "RBC T5 Box 13 interest matches" or "appears consistent", you MUST have verified: Client Slip shows X and DT Max shows X (same value).
- If Client Slip shows 78.63 and DT Max shows 78.36, DO NOT say "matches" or "consistent" - this is a DISCREPANCY that MUST be listed in the DISCREPANCIES FOUND section above.
- If you are unsure or cannot clearly see both values, do NOT claim they match. Report it as a discrepancy or missing data instead.
- When in doubt, report it as a discrepancy. It is better to flag a potential error than to miss a real one.`;

      // Prepare content for OpenAI Vision API
      const content: any[] = [
        {
          type: 'text',
          text: `${basePrompt}\n\n--- USER INSTRUCTIONS ---\n${prompt}\n\n--- DOCUMENTS TO COMPARE ---\nDT Max Workspace files (${dtMaxImages.length} images): ${dtMaxImages.map((f: any) => f.name).join(', ')}\n\nClient Tax Slips files (${clientSlipsImages.length} images): ${clientSlipsImages.map((f: any) => f.name).join(', ')}`,
        },
      ];

      // Add DT Max images
      for (const file of dtMaxImages) {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${file.base64}`,
            detail: 'high',
          },
        });
      }

      // Add Client Slip images
      for (const file of clientSlipsImages) {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${file.base64}`,
            detail: 'high',
          },
        });
      }

      // Log the request structure (without full base64 to avoid log spam)
      log.info('OpenAI API Request:', {
        dtMaxImagesCount: dtMaxImages.length,
        clientSlipsImagesCount: clientSlipsImages.length,
        contentItemsCount: content.length,
        contentTypes: content.map((item: any) => item.type),
        sampleDtMaxImage: dtMaxImages.length > 0 ? {
          name: dtMaxImages[0].name,
          type: dtMaxImages[0].type,
          base64Preview: dtMaxImages[0].base64?.substring(0, 100),
        } : null,
        sampleClientSlipImage: clientSlipsImages.length > 0 ? {
          name: clientSlipsImages[0].name,
          type: clientSlipsImages[0].type,
          base64Preview: clientSlipsImages[0].base64?.substring(0, 100),
        } : null,
      });

      const startTime = Date.now();

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content: 'You are a tax document comparison assistant with exceptional attention to detail. You can see and analyze images. Your primary task is to extract EXACT numerical values from tax documents with 100% accuracy, reading each digit carefully including decimal places. You must follow a multi-step process: (1) Extract the exact value from the Client Tax Slip image, (2) Extract the exact value from the DT Max Workspace image, (3) Compare digit by digit, (4) Report any discrepancies. Pay extreme attention to cents and decimal places. Never calculate or mention dollar differences - only report expected vs entered values with error descriptions.',
          },
          {
            role: 'user',
            content,
          },
        ],
        max_completion_tokens: 4096,
      });

      const endTime = Date.now();
      const totalSeconds = Math.floor((endTime - startTime) / 1000);

      // Calculate cost (approximate for gpt-4.1 - update pricing if needed)
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const inputCost = (inputTokens / 1000000) * 0.15; // $0.15 per 1M input tokens
      const outputCost = (outputTokens / 1000000) * 0.60; // $0.60 per 1M output tokens
      const totalCost = inputCost + outputCost;

      return {
        success: true,
        result: response.choices[0]?.message?.content || 'No response from AI',
        cost: totalCost,
        timeSeconds: totalSeconds,
        usage: response.usage,
        debug: {
          dtMaxImagesCount: dtMaxImages.length,
          clientSlipsImagesCount: clientSlipsImages.length,
          totalContentItems: content.length,
          contentTypes: content.map((item: any) => item.type),
          model: 'gpt-4.1',
          inputTokens,
          outputTokens,
        },
      };
    } catch (error: any) {
      log.error('Error in OpenAI comparison:', error);
      return {
        success: false,
        error: error.message || 'Failed to compare files with OpenAI',
      };
    }
  },
);

// Email automation handlers
ipcMain.handle(
  'generate-email-response',
  async (event, { customerInquiry, replyMode, templateContent }) => {
    try {
      const OpenAI = require('openai').default;

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not found in environment variables');
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      let systemPrompt = '';
      let userPrompt = '';

      if (replyMode === 'ai') {
        // AI-only mode: Generate a professional email response
        systemPrompt = `You are a professional email assistant for a tax preparation service.
Generate clear, professional, and helpful email responses to customer inquiries.
Be concise, friendly, and address all questions thoroughly.
Format your response in HTML for rich text display:
- Use <p> tags for paragraphs
- Use <strong> for emphasis
- Use <br> for line breaks within paragraphs
- Use <ul>/<li> for lists when appropriate`;
        userPrompt = `Customer inquiry/email:\n\n${customerInquiry}\n\nPlease generate a professional email response in HTML format.`;
      } else if (replyMode === 'template') {
        // Template-only mode: Use the template as-is
        return {
          success: true,
          result: templateContent,
        };
      } else if (replyMode === 'template-ai') {
        // Template + AI mode: Enhance the template with AI based on the inquiry
        const hasInquiry = customerInquiry && customerInquiry.trim();

        systemPrompt = `You are a professional email assistant for a tax preparation service.
${hasInquiry
  ? 'You will be given a customer inquiry and an email template. Customize the template to address the specific customer inquiry while maintaining the template\'s structure and key information.'
  : 'You will be given an email template. Improve the template by enhancing clarity, professionalism, and readability while maintaining the core message.'}
Make the response personal, relevant, and professional.
IMPORTANT: Do NOT use placeholder text like [Your Name], [Your Position], [Your Company], or [Contact Information].
Use the actual signature information provided: Nawaf Sankari, Fiscal Specialist and Financial Security Advisor, Sankari Inc., Fiscal and Financial Services, www.sankari.ca, taxdeclaration@sankari.ca.
Format your response in HTML for rich text display:
- Use <p> tags for paragraphs
- Use <strong> for emphasis
- Use <br> for line breaks within paragraphs
- Use <ul>/<li> for lists when appropriate
Return your response in JSON format with "subject" and "body" fields.`;

        userPrompt = hasInquiry
          ? `Customer inquiry/email:\n\n${customerInquiry}\n\nEmail template to customize:\n\n${templateContent}\n\nPlease customize this template to address the customer's inquiry. Keep the template structure but personalize it for this specific customer. Return your response as JSON with "subject" and "body" fields (body should be HTML formatted). Do NOT include placeholders - use actual information.`
          : `Email template to improve:\n\n${templateContent}\n\nPlease improve this template by enhancing clarity, professionalism, and readability. Return your response as JSON with "subject" and "body" fields (body should be HTML formatted). Do NOT include placeholders - use actual information.`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      return {
        success: true,
        result: response.choices[0]?.message?.content || 'No response from AI',
      };
    } catch (error: any) {
      log.error('Error generating email response:', error);

      // Handle specific OpenAI API errors
      let errorMessage = error.message || 'Failed to generate email response';

      if (error.status === 429 || error.message?.includes('429')) {
        errorMessage = '429 You exceeded your current quota, please check your plan and billing details.';
      } else if (error.status === 401 || error.message?.includes('401')) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key configuration.';
      } else if (error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.status === 500 || error.message?.includes('500')) {
        errorMessage = 'OpenAI server error. Please try again later.';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
);

ipcMain.handle('fix-email-template-with-ai', async (event, templateContent) => {
  try {
    const OpenAI = require('openai').default;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found in environment variables');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are a professional email writing assistant.
Your task is to improve email templates by:
- Fixing grammar and spelling errors
- Improving clarity and readability
- Enhancing professionalism and tone
- Maintaining the original intent and key information
- Making the language more concise and effective

The input may be plain text or HTML. Return the improved content in HTML format:
- Use <p> tags for paragraphs
- Use <strong> for emphasis
- Use <br> for line breaks within paragraphs
- Use <ul>/<li> for lists when appropriate
- Preserve any existing HTML formatting and styling

Return only the improved HTML content, without explanations or additional text.`;

    const userPrompt = `Please improve this email template and return it as HTML:\n\n${templateContent}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.5,
    });

    return {
      success: true,
      result: response.choices[0]?.message?.content || templateContent,
    };
  } catch (error: any) {
    log.error('Error fixing template with AI:', error);

    // Handle specific OpenAI API errors
    let errorMessage = error.message || 'Failed to fix template with AI';

    if (error.status === 429 || error.message?.includes('429')) {
      errorMessage = '429 You exceeded your current quota, please check your plan and billing details.';
    } else if (error.status === 401 || error.message?.includes('401')) {
      errorMessage = 'Invalid API key. Please check your OpenAI API key configuration.';
    } else if (error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (error.status === 500 || error.message?.includes('500')) {
      errorMessage = 'OpenAI server error. Please try again later.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
});

ipcMain.on('run-python', (event, scriptName, args) => {
  // Determine Python executable path based on environment
  let pythonPath: string;

  if (app.isPackaged) {
    // Production: Use bundled Python executables (--onedir mode)
    const exeName =
      process.platform === 'win32' ? `${scriptName}.exe` : scriptName;
    // For --onedir mode: executable is in subdirectory with same name
    pythonPath = path.join(
      process.resourcesPath,
      'Python',
      scriptName,
      exeName
    );
  } else {
    // Development: Use Python scripts
    const scriptPath = path.join(
      __dirname,
      '../../../Python',
      `${scriptName}.py`,
    );
    pythonPath = scriptPath;
  }

  // Execute Python script or executable
  const execArgs = app.isPackaged ? args : [pythonPath, ...args];
  const execCommand = app.isPackaged ? pythonPath : 'python';

  log.info(`Executing Python: ${execCommand} with args:`, execArgs);

  execFile(execCommand, execArgs, (error, stdout, stderr) => {
    if (error) {
      log.error(`Error executing script: ${stderr}`);
      event.reply('python-result', { success: false, error: stderr });
      return;
    }
    log.info('Python script executed successfully');
    event.reply('python-result', { success: true, result: stdout });
  });
});

// ===========================
// DATABASE IPC HANDLERS
// ===========================

// Configurations
ipcMain.handle('db:getConfigurations', async () => {
  try {
    const data = await db.getConfigurations();
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting configurations:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:updateConfigurations', async (event, config) => {
  try {
    const data = await db.updateConfigurations(config);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error updating configurations:', error);
    return { data: null, error: { message: error.message } };
  }
});

// Tax Rates
ipcMain.handle('db:getAllTaxRates', async () => {
  try {
    const data = await db.getAllTaxRates();
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting tax rates:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:getTaxRateByProvince', async (event, province) => {
  try {
    const data = await db.getTaxRateByProvince(province);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting tax rate by province:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:bulkReplaceTaxRates', async (event, rates) => {
  try {
    const data = await db.bulkReplaceTaxRates(rates);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error bulk replacing tax rates:', error);
    return { data: null, error: { message: error.message } };
  }
});

// Price List
ipcMain.handle('db:getAllPrices', async () => {
  try {
    const data = await db.getAllPrices();
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting prices:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:bulkReplacePrices', async (event, prices) => {
  try {
    const data = await db.bulkReplacePrices(prices);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error bulk replacing prices:', error);
    return { data: null, error: { message: error.message } };
  }
});

// Invoice Number
ipcMain.handle('db:getInvoiceNumber', async () => {
  try {
    const data = await db.getInvoiceNumber();
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting invoice number:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:updateInvoiceNumber', async (event, invoiceNum) => {
  try {
    const data = await db.updateInvoiceNumber(invoiceNum);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error updating invoice number:', error);
    return { data: null, error: { message: error.message } };
  }
});

// Users
ipcMain.handle('db:verifyPassword', async (event, password) => {
  try {
    const data = await db.verifyPassword(password);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error verifying password:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:updatePassword', async (event, oldPassword, newPassword) => {
  try {
    const data = await db.updatePassword(oldPassword, newPassword);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error updating password:', error);
    return { data: null, error: { message: error.message } };
  }
});

// Email Templates
ipcMain.handle('db:getAllEmailTemplates', async () => {
  try {
    const data = await db.getAllEmailTemplates();
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting email templates:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:getEmailTemplateById', async (event, id) => {
  try {
    const data = await db.getEmailTemplateById(id);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting email template by id:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:getEmailTemplateByName', async (event, templateName) => {
  try {
    const data = await db.getEmailTemplateByName(templateName);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error getting email template by name:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:createEmailTemplate', async (event, template) => {
  try {
    const data = await db.createEmailTemplate(template);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error creating email template:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:updateEmailTemplate', async (event, id, template) => {
  try {
    const data = await db.updateEmailTemplate(id, template);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error updating email template:', error);
    return { data: null, error: { message: error.message } };
  }
});

ipcMain.handle('db:deleteEmailTemplate', async (event, id) => {
  try {
    const data = await db.deleteEmailTemplate(id);
    return { data, error: null };
  } catch (error: any) {
    log.error('Error deleting email template:', error);
    return { data: null, error: { message: error.message } };
  }
});

// Close database pool on app quit
app.on('will-quit', async () => {
  await db.closePool();
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    show: false,
    width,
    height,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.maximize();
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  new AppUpdater();
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
