# 🔄 Cryptocurrency Update - Complete Changes

## Changes Made

### Old Cryptocurrencies → New Cryptocurrencies
- ❌ TON (Toncoin) → ✅ SOL (Solana)
- ❌ CATI (Catizen) → ✅ ETH (Ethereum)
- ✅ USDT (Tether) → ✅ USDT (Main withdrawal currency)
- ➕ USDC (USD Coin) - Added

### Main Withdrawal Currency
**USDT** is now the primary withdrawal currency with the lowest minimum (10 USDT)

---

## Real Cryptocurrency Details

### 1. SOL (Solana)
- **Full Name:** Solana
- **Symbol:** SOL
- **Decimals:** 9
- **Networks:** Solana Mainnet
- **Minimum Withdrawal:** 0.01 SOL (~$1)
- **Network Fee:** 0.000005 SOL
- **Address Format:** Base58, starts with letters/numbers (32-44 chars)
- **Example:** `7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK`

### 2. ETH (Ethereum)
- **Full Name:** Ethereum
- **Symbol:** ETH
- **Decimals:** 18
- **Networks:** 
  - Ethereum Mainnet (ERC20)
  - Arbitrum
  - Optimism
  - Polygon
  - BSC (BEP20)
- **Minimum Withdrawal:** 0.001 ETH (~$2)
- **Network Fees:**
  - Ethereum: 0.001 ETH (~$2)
  - Arbitrum: 0.0001 ETH (~$0.20)
  - Optimism: 0.0001 ETH (~$0.20)
  - Polygon: 0.001 ETH (~$0.10)
  - BSC: 0.0005 ETH (~$1)
- **Address Format:** 0x + 40 hex characters
- **Example:** `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

### 3. USDT (Tether) - MAIN CURRENCY
- **Full Name:** Tether USD
- **Symbol:** USDT
- **Decimals:** 6
- **Networks:**
  - TRC20 (Tron) - Recommended (Low fees)
  - ERC20 (Ethereum)
  - BEP20 (BSC)
  - Polygon
  - Solana
  - Arbitrum
- **Minimum Withdrawal:** 10 USDT
- **Network Fees:**
  - TRC20: 1 USDT (Recommended)
  - ERC20: 5 USDT
  - BEP20: 0.8 USDT
  - Polygon: 0.1 USDT
  - Solana: 0.01 USDT
  - Arbitrum: 0.5 USDT
- **Address Formats:**
  - TRC20: Starts with 'T' (34 chars)
  - ERC20/BEP20: 0x + 40 hex
  - Solana: Base58
- **Examples:**
  - TRC20: `TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9`
  - ERC20: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

### 4. USDC (USD Coin)
- **Full Name:** USD Coin
- **Symbol:** USDC
- **Decimals:** 6
- **Networks:**
  - Ethereum (ERC20)
  - Solana (SPL)
  - Polygon
  - Arbitrum
  - Optimism
  - BSC (BEP20)
- **Minimum Withdrawal:** 10 USDC
- **Network Fees:**
  - Ethereum: 5 USDC
  - Solana: 0.01 USDC (Recommended)
  - Polygon: 0.1 USDC
  - Arbitrum: 0.5 USDC
  - BSC: 0.8 USDC
- **Address Formats:** Same as USDT per network
- **Examples:** Same format as USDT per network

---

## Network Details

### Solana Mainnet
- **Chain ID:** Mainnet-beta
- **RPC:** https://api.mainnet-beta.solana.com
- **Explorer:** https://solscan.io
- **Confirmation Time:** ~0.4 seconds
- **Finality:** ~13 seconds

### Ethereum Mainnet
- **Chain ID:** 1
- **RPC:** https://eth.llamarpc.com
- **Explorer:** https://etherscan.io
- **Confirmation Time:** ~12 seconds
- **Finality:** ~15 minutes

### Tron (TRC20)
- **Chain ID:** Mainnet
- **RPC:** https://api.trongrid.io
- **Explorer:** https://tronscan.org
- **Confirmation Time:** ~3 seconds
- **Finality:** ~1 minute

### BSC (BEP20)
- **Chain ID:** 56
- **RPC:** https://bsc-dataseed.binance.org
- **Explorer:** https://bscscan.com
- **Confirmation Time:** ~3 seconds
- **Finality:** ~15 seconds

### Polygon
- **Chain ID:** 137
- **RPC:** https://polygon-rpc.com
- **Explorer:** https://polygonscan.com
- **Confirmation Time:** ~2 seconds
- **Finality:** ~30 seconds

### Arbitrum
- **Chain ID:** 42161
- **RPC:** https://arb1.arbitrum.io/rpc
- **Explorer:** https://arbiscan.io
- **Confirmation Time:** ~0.3 seconds
- **Finality:** ~15 minutes

---

## Conversion Rates (Points to Crypto)

### Default Rates (10,000 points = 1 unit)
- **SOL:** 10,000 points = 0.01 SOL (~$1)
- **ETH:** 10,000 points = 0.0005 ETH (~$1)
- **USDT:** 10,000 points = 1 USDT
- **USDC:** 10,000 points = 1 USDC

### VIP Tier Bonuses
- **Bronze (1-5):** Standard rate
- **Silver (6-15):** 5% better (9,500 points per unit)
- **Gold (16-30):** 10% better (9,000 points per unit)
- **Platinum (31-50):** 15% better (8,500 points per unit)
- **Diamond (51+):** 20% better (8,000 points per unit)

---

## Minimum Withdrawals

| Currency | Minimum | Recommended Network | Fee |
|----------|---------|-------------------|-----|
| SOL | 0.01 SOL | Solana | 0.000005 SOL |
| ETH | 0.001 ETH | Arbitrum | 0.0001 ETH |
| **USDT** | **10 USDT** | **TRC20** | **1 USDT** |
| USDC | 10 USDC | Solana | 0.01 USDC |

---

## Address Validation Rules

### SOL (Solana)
```javascript
- Length: 32-44 characters
- Format: Base58 (alphanumeric)
- No special characters
- Example: 7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK
```

### ETH (All EVM chains)
```javascript
- Starts with: 0x
- Length: 42 characters (including 0x)
- Format: Hexadecimal (0-9, a-f)
- Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### TRC20 (Tron)
```javascript
- Starts with: T
- Length: 34 characters
- Format: Base58
- Example: TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9
```

---

## Database Changes

### Tables Updated
1. **balances** - Changed columns:
   - `ton` → `sol`
   - `cati` → `eth`
   - `usdt` → `usdt` (kept)
   - Added: `usdc`

2. **daily_rewards** - Changed columns:
   - `ton_earned` → `sol_earned`
   - `cati_earned` → `eth_earned`
   - `usdt_earned` → `usdt_earned` (kept)
   - Added: `usdc_earned`

3. **site_settings** - Updated:
   - `min_withdrawal_ton` → `min_withdrawal_sol` (0.01)
   - `min_withdrawal_cati` → `min_withdrawal_eth` (0.001)
   - `min_withdrawal_usdt` → `min_withdrawal_usdt` (10) - Main
   - Added: `min_withdrawal_usdc` (10)

4. **tasks** - Updated:
   - "Earn 10 TON" → "Earn 100 USDT"

---

## Frontend Changes

### Files Updated
1. **src/db/supabase-schema.sql** - Database schema
2. **src/db/supabase.js** - Database methods
3. **src/App.js** - Initial balance state
4. **src/pages/ConversionPage.js** - Conversion logic
5. **src/pages/LeaderboardPage.js** - Earnings display
6. **README.md** - Documentation

### UI Changes
- Currency selectors updated
- Network options updated
- Minimum amounts updated
- Fee calculations updated
- Address validation updated

---

## Testing Checklist

### Conversion Testing
- [ ] Convert points to SOL
- [ ] Convert points to ETH
- [ ] Convert points to USDT
- [ ] Convert points to USDC
- [ ] Verify balances update correctly

### Withdrawal Testing
- [ ] Withdraw SOL (Solana network)
- [ ] Withdraw ETH (multiple networks)
- [ ] Withdraw USDT (TRC20 recommended)
- [ ] Withdraw USDC (Solana recommended)
- [ ] Verify address validation works
- [ ] Check network fee calculations

### Database Testing
- [ ] New users get all 4 balances
- [ ] Existing users can be migrated
- [ ] Conversion history records correctly
- [ ] Withdrawal requests save properly

---

## Migration for Existing Users

### Option 1: Fresh Start (Recommended)
```sql
-- Clear all balances and start fresh
TRUNCATE TABLE balances CASCADE;
TRUNCATE TABLE conversion_history CASCADE;
TRUNCATE TABLE withdrawal_requests CASCADE;
```

### Option 2: Migrate Existing Data
```sql
-- Add new columns
ALTER TABLE balances ADD COLUMN IF NOT EXISTS sol DECIMAL(18, 8) DEFAULT 0;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS eth DECIMAL(18, 8) DEFAULT 0;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS usdc DECIMAL(18, 8) DEFAULT 0;

-- Migrate TON to SOL (1:1 ratio for simplicity)
UPDATE balances SET sol = ton WHERE ton > 0;

-- Migrate CATI to ETH (adjust ratio as needed)
UPDATE balances SET eth = cati * 0.0005 WHERE cati > 0;

-- USDT stays the same
-- USDC starts at 0

-- Drop old columns (optional, after verification)
-- ALTER TABLE balances DROP COLUMN ton;
-- ALTER TABLE balances DROP COLUMN cati;
```

---

## Recommended Networks by Use Case

### Lowest Fees
1. **USDT on TRC20** - 1 USDT fee
2. **USDC on Solana** - 0.01 USDC fee
3. **SOL on Solana** - 0.000005 SOL fee

### Fastest Confirmation
1. **SOL on Solana** - 0.4 seconds
2. **ETH on Arbitrum** - 0.3 seconds
3. **USDT on Polygon** - 2 seconds

### Most Compatible
1. **USDT on TRC20** - Widely supported
2. **ETH on Ethereum** - Universal support
3. **USDC on Ethereum** - Major exchanges

---

## Support Resources

### Block Explorers
- **Solana:** https://solscan.io
- **Ethereum:** https://etherscan.io
- **Tron:** https://tronscan.org
- **BSC:** https://bscscan.com
- **Polygon:** https://polygonscan.com
- **Arbitrum:** https://arbiscan.io

### Price APIs
- **CoinGecko:** https://api.coingecko.com/api/v3/simple/price
- **CoinMarketCap:** https://coinmarketcap.com/api
- **Binance:** https://api.binance.com/api/v3/ticker/price

---

## 🎉 Update Complete!

Your platform now supports:
- ✅ SOL (Solana)
- ✅ ETH (Ethereum)
- ✅ USDT (Tether) - Main withdrawal currency
- ✅ USDC (USD Coin)

With real network details and proper validation!

---

© 2024 Cipro. All rights reserved.
