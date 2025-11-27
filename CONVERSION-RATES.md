# 💰 Accurate Conversion Rates - Cipro

## Base Conversion Rate

**10,000 points = $1 USD**

This is the foundation for all cryptocurrency conversions.

---

## Cryptocurrency Conversion Rates

### Based on Real Market Prices

| Crypto | Market Price | Points per 1 Unit | Points per $1 |
|--------|-------------|-------------------|---------------|
| **USDT** | $1.00 | 10,000 | 10,000 |
| **USDC** | $1.00 | 10,000 | 10,000 |
| **SOL** | ~$100 | 1,000,000 | 10,000 |
| **ETH** | ~$2,000 | 20,000,000 | 10,000 |

---

## Conversion Examples

### USDT/USDC (Stablecoins)
- 10,000 points = 1 USDT/USDC
- 100,000 points = 10 USDT/USDC
- 1,000,000 points = 100 USDT/USDC

### SOL (Solana)
- 10,000 points = 0.01 SOL (~$1)
- 100,000 points = 0.1 SOL (~$10)
- 1,000,000 points = 1 SOL (~$100)

### ETH (Ethereum)
- 10,000 points = 0.0005 ETH (~$1)
- 100,000 points = 0.005 ETH (~$10)
- 1,000,000 points = 0.05 ETH (~$50)
- 20,000,000 points = 1 ETH (~$2,000)

---

## VIP Tier Bonuses

VIP members get better conversion rates:

| Tier | Discount | Effective Rate | Example (1 USDT) |
|------|----------|----------------|------------------|
| Bronze | 0% | 10,000 pts | 10,000 pts |
| Silver | 5% | 9,500 pts | 9,500 pts |
| Gold | 10% | 9,000 pts | 9,000 pts |
| Platinum | 15% | 8,500 pts | 8,500 pts |
| Diamond | 20% | 8,000 pts | 8,000 pts |

---

## Implementation Details

### Code (ConversionPage.js)
```javascript
const BASE_CONVERSION_RATES = {
  sol: 1000000,    // 1 SOL = $100
  eth: 20000000,   // 1 ETH = $2,000
  usdt: 10000,     // 1 USDT = $1
  usdc: 10000      // 1 USDC = $1
};
```

### Database (site_settings)
```sql
('conversion_rate_sol', '1000000', 'number', 'conversion', 'Points per 1 SOL'),
('conversion_rate_eth', '20000000', 'number', 'conversion', 'Points per 1 ETH'),
('conversion_rate_usdt', '10000', 'number', 'conversion', 'Points per 1 USDT'),
('conversion_rate_usdc', '10000', 'number', 'conversion', 'Points per 1 USDC')
```

---

© 2024 Cipro. All rights reserved.
