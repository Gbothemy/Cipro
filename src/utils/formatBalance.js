/**
 * Format cryptocurrency balance to show full precision without scientific notation
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency type (sol, eth, usdt, usdc)
 * @returns {string} - Formatted balance string
 */
export const formatBalance = (amount, currency = '') => {
  if (!amount || amount === 0) return '0';
  
  // Convert to number if it's a string
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0';
  
  // For very small numbers, use fixed precision to avoid scientific notation
  if (num < 0.000001) {
    return num.toFixed(8).replace(/\.?0+$/, ''); // Remove trailing zeros
  }
  
  // For small numbers, use appropriate precision
  if (num < 0.01) {
    return num.toFixed(6).replace(/\.?0+$/, '');
  }
  
  // For larger numbers, use standard precision
  if (num < 1) {
    return num.toFixed(4).replace(/\.?0+$/, '');
  }
  
  // For whole numbers and larger amounts
  return num.toString();
};

/**
 * Format cryptocurrency balance with currency symbol
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency type (sol, eth, usdt, usdc)
 * @returns {string} - Formatted balance with currency
 */
export const formatBalanceWithCurrency = (amount, currency) => {
  const formattedAmount = formatBalance(amount, currency);
  
  const currencySymbols = {
    sol: '◎',
    eth: 'Ξ',
    usdt: '💵',
    usdc: '💵'
  };
  
  const symbol = currencySymbols[currency.toLowerCase()] || '';
  const currencyName = currency.toUpperCase();
  
  return `${symbol} ${formattedAmount} ${currencyName}`;
};

/**
 * Format balance for display in UI components
 * @param {number} amount - The amount to format
 * @param {number} minDecimals - Minimum decimal places to show
 * @param {number} maxDecimals - Maximum decimal places to show
 * @returns {string} - Formatted balance
 */
export const formatBalanceDisplay = (amount, minDecimals = 0, maxDecimals = 8) => {
  if (!amount || amount === 0) return '0';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  // Use toFixed with maxDecimals and then remove trailing zeros
  const fixed = num.toFixed(maxDecimals);
  const trimmed = fixed.replace(/\.?0+$/, '');
  
  // Ensure minimum decimal places
  if (minDecimals > 0) {
    const parts = trimmed.split('.');
    if (!parts[1]) {
      return trimmed + '.' + '0'.repeat(minDecimals);
    } else if (parts[1].length < minDecimals) {
      return trimmed + '0'.repeat(minDecimals - parts[1].length);
    }
  }
  
  return trimmed;
};