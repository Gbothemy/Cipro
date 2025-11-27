# 🚀 Quick Setup Guide - Professional Withdrawal System

## ⚡ Fast Setup (5 Minutes)

### Step 1: Update Database (2 minutes)
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this command:

```sql
-- Add new columns to withdrawal_requests table
ALTER TABLE withdrawal_requests 
ADD COLUMN IF NOT EXISTS network TEXT,
ADD COLUMN IF NOT EXISTS memo TEXT,
ADD COLUMN IF NOT EXISTS network_fee DECIMAL(18, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(18, 8),
ADD COLUMN IF NOT EXISTS transaction_hash TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update existing records
UPDATE withdrawal_requests 
SET net_amount = amount 
WHERE net_amount IS NULL;
```

3. Click **RUN** ✅

### Step 2: Verify Installation (1 minute)
```sql
-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'withdrawal_requests'
ORDER BY column_name;
```

You should see these columns:
- ✅ network
- ✅ memo
- ✅ network_fee
- ✅ net_amount
- ✅ transaction_hash
- ✅ rejection_reason

### Step 3: Test the System (2 minutes)
1. Start your app: `npm start`
2. Login as a user
3. Go to **Convert & Withdraw** page
4. Try converting points
5. Try requesting a withdrawal
6. Check **Transaction History** tab

---

## ✅ What's New

### For Users
- 💎 Convert points to TON, CATI, or USDT
- 🌐 Select network (TON, BEP20, ERC20, TRC20)
- 💰 See network fees before withdrawal
- 📜 View complete transaction history
- 🔔 Get notifications on approval/rejection
- 📊 See earnings on leaderboard

### For Admins
- 👀 View all withdrawal details
- ✅ Approve/reject withdrawals
- 📝 Add transaction hash
- 🔔 Auto-notify users
- 📊 Track all transactions

---

## 🎯 Quick Test

### Test Conversion
1. Go to Convert & Withdraw
2. Select currency (TON/CATI/USDT)
3. Enter points amount
4. Click "Convert to Crypto"
5. Check balance updated ✅

### Test Withdrawal
1. Click "Withdraw Crypto" tab
2. Select currency
3. Select network
4. Enter amount
5. Enter wallet address
6. Review summary
7. Click "Request Withdrawal"
8. Check Transaction History ✅

### Test Notifications
1. Admin approves withdrawal
2. User receives notification ✅
3. Check Notifications page ✅

---

## 🔧 Troubleshooting

### Issue: Columns not added
**Solution:**
```sql
-- Drop and recreate table (BACKUP FIRST!)
-- Or manually add each column one by one
ALTER TABLE withdrawal_requests ADD COLUMN network TEXT;
ALTER TABLE withdrawal_requests ADD COLUMN memo TEXT;
-- etc...
```

### Issue: Conversion not working
**Check:**
- User has enough points
- Minimum is 1,000 points
- Database connection working
- Check browser console for errors

### Issue: Withdrawal not working
**Check:**
- User has enough balance
- Meets minimum withdrawal
- Wallet address format correct
- Network selected
- Check browser console

---

## 📱 Features Overview

### Withdrawal Form
- ✅ Multi-currency (TON, CATI, USDT)
- ✅ Network selection
- ✅ Address validation
- ✅ Fee calculation
- ✅ Withdrawal summary
- ✅ Quick amount buttons

### Transaction History
- ✅ Conversion history
- ✅ Withdrawal requests
- ✅ Status tracking
- ✅ Date/time stamps
- ✅ Request IDs

### Notifications
- ✅ Approval notifications
- ✅ Rejection notifications
- ✅ Activity logging
- ✅ Real-time updates

### Leaderboard
- ✅ Earnings ranking
- ✅ All crypto balances
- ✅ Total earnings
- ✅ Top 10 display

---

## 🎉 You're Done!

Your professional withdrawal system is ready! 🚀

**Next Steps:**
1. Test all features
2. Configure minimum amounts (if needed)
3. Set up admin accounts
4. Start processing withdrawals!

---

## 📞 Need Help?

Check these files:
- `PROFESSIONAL-WITHDRAWAL-SYSTEM-COMPLETE.md` - Full documentation
- `MAJOR-UPDATE-V2-IMPLEMENTATION.md` - All updates
- `UPDATED-DATABASE-SCHEMA-V2.sql` - Complete schema

**Happy withdrawing!** 💰
