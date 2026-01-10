/**
 * API Client
 * Uses Electron IPC to communicate with MySQL database via main process
 *
 * Usage:
 *   import { api } from './apiClient';
 *   const { data, error } = await api.configurations.get();
 */

/**
 * Configurations API
 */
const configurations = {
  /**
   * Get configuration
   * @returns {Promise<{data: any, error: any}>}
   */
  async get() {
    return window.electron.database.getConfigurations();
  },

  /**
   * Update configuration
   * @param {object} config - Configuration data
   * @returns {Promise<{data: any, error: any}>}
   */
  async update(config) {
    return window.electron.database.updateConfigurations(config);
  },
};

/**
 * Tax Rates API
 */
const taxRates = {
  /**
   * Get all tax rates
   * @returns {Promise<{data: any, error: any}>}
   */
  async getAll() {
    return window.electron.database.getAllTaxRates();
  },

  /**
   * Get tax rate by province
   * @param {string} province - Province code
   * @returns {Promise<{data: any, error: any}>}
   */
  async getByProvince(province) {
    return window.electron.database.getTaxRateByProvince(province);
  },

  /**
   * Bulk replace tax rates
   * @param {Array} rates - Array of tax rate objects
   * @returns {Promise<{data: any, error: any}>}
   */
  async bulkReplace(rates) {
    return window.electron.database.bulkReplaceTaxRates(rates);
  },
};

/**
 * Price List API
 */
const priceList = {
  /**
   * Get all prices
   * @returns {Promise<{data: any, error: any}>}
   */
  async getAll() {
    return window.electron.database.getAllPrices();
  },

  /**
   * Bulk replace prices
   * @param {Array} prices - Array of price objects
   * @returns {Promise<{data: any, error: any}>}
   */
  async bulkReplace(prices) {
    return window.electron.database.bulkReplacePrices(prices);
  },
};

/**
 * Invoice Number API
 */
const invoiceNumber = {
  /**
   * Get current invoice number
   * @returns {Promise<{data: any, error: any}>}
   */
  async get() {
    return window.electron.database.getInvoiceNumber();
  },

  /**
   * Update invoice number
   * @param {number} invoiceNum - New invoice number
   * @returns {Promise<{data: any, error: any}>}
   */
  async update(invoiceNum) {
    return window.electron.database.updateInvoiceNumber(invoiceNum);
  },
};

/**
 * Users API
 */
const users = {
  /**
   * Verify admin password
   * @param {string} password - Password to verify
   * @returns {Promise<{data: any, error: any}>}
   */
  async verifyPassword(password) {
    return window.electron.database.verifyPassword(password);
  },

  /**
   * Update admin password
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<{data: any, error: any}>}
   */
  async updatePassword(oldPassword, newPassword) {
    return window.electron.database.updatePassword(oldPassword, newPassword);
  },
};

/**
 * Main API object (similar to Supabase interface)
 */
export const api = {
  configurations,
  taxRates,
  priceList,
  invoiceNumber,
  users,
};
