// Company Wallet Configuration
// This file contains the official company wallet addresses for receiving payments

export const COMPANY_WALLETS = {
  // USDT (ERC-20) - Ethereum Network
  USDT: {
    address: '0x686DB56e004F65B0128D69D3c0FBacFD1E3cabf6',
    network: 'Ethereum (ERC-20)',
    tokenContract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    chainId: 60,
    trustWalletLink: 'https://link.trustwallet.com/send?coin=60&address=0x686DB56e004F65B0128D69D3c0FBacFD1E3cabf6&token_id=0xdAC17F958D2ee523a2206206994597C13D831ec7',
    qrCodeData: 'ethereum:0x686DB56e004F65B0128D69D3c0FBacFD1E3cabf6',
    displayName: 'USDT (ERC-20)',
    icon: '💵',
    minDeposit: 10, // Minimum $10 USDT
    confirmations: 12 // Required confirmations
  },
  
  // USDC (ERC-20) - Ethereum Network
  USDC: {
    address: '0x686DB56e004F65B0128D69D3c0FBacFD1E3cabf6',
    network: 'Ethereum (ERC-20)',
    tokenContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    chainId: 60,
    displayName: 'USDC (ERC-20)',
    icon: '💵',
    minDeposit: 10,
    confirmations: 12
  },

  // ETH - Ethereum Network
  ETH: {
    address: '0x686DB56e004F65B0128D69D3c0FBacFD1E3cabf6',
    network: 'Ethereum',
    chainId: 60,
    displayName: 'Ethereum (ETH)',
    icon: 'Ξ',
    minDeposit: 0.005, // Minimum 0.005 ETH
    confirmations: 12
  },

  // SOL - Solana Network (if you want to add Solana support)
  SOL: {
    address: '', // Add Solana address if needed
    network: 'Solana',
    displayName: 'Solana (SOL)',
    icon: '◎',
    minDeposit: 0.1,
    confirmations: 32
  }
};

// Get wallet address for specific currency
export const getWalletAddress = (currency) => {
  const wallet = COMPANY_WALLETS[currency.toUpperCase()];
  return wallet ? wallet.address : null;
};

// Get wallet info for specific currency
export const getWalletInfo = (currency) => {
  return COMPANY_WALLETS[currency.toUpperCase()] || null;
};

// Validate wallet address format
export const isValidAddress = (address, currency) => {
  const wallet = COMPANY_WALLETS[currency.toUpperCase()];
  if (!wallet) return false;
  
  // Basic Ethereum address validation
  if (currency === 'USDT' || currency === 'USDC' || currency === 'ETH') {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  
  return true;
};

// Generate payment link
export const generatePaymentLink = (currency, amount = null) => {
  const wallet = COMPANY_WALLETS[currency.toUpperCase()];
  if (!wallet) return null;
  
  if (wallet.trustWalletLink) {
    return amount 
      ? `${wallet.trustWalletLink}&amount=${amount}`
      : wallet.trustWalletLink;
  }
  
  return null;
};

// Generate QR code data
export const generateQRData = (currency, amount = null) => {
  const wallet = COMPANY_WALLETS[currency.toUpperCase()];
  if (!wallet) return null;
  
  const baseData = wallet.qrCodeData || `ethereum:${wallet.address}`;
  return amount ? `${baseData}?value=${amount}` : baseData;
};

export default COMPANY_WALLETS;
