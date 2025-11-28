# 🔧 Referral System Troubleshooting Guide

## Issue: Referred Users Not Showing Up

If users you referred are not appearing in your referrals list, follow these steps:

---

## ✅ Step 1: Run the Database Migration

The `referred_by` column needs to be added to your database.

### In Supabase Dashboard:

1. Go to your Supabase project
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Add referred_by column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
```

5. Click **Run** or press `Ctrl+Enter`
6. You should see: "Success. No rows returned"

### Verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'referred_by';
```

You should see:
```
column_name  | data_type
-------------|----------
referred_by  | text
```

---

## ✅ Step 2: Test the Referral Flow

### A. Get Your Referral Link

1. Login to your account
2. Go to **Referral** page
3. Copy your referral link (should look like):
   ```
   https://cipro1.vercel.app/login?ref=USR-1234567890-ABC123
   ```

### B. Test Signup with Referral

1. Open an **incognito/private window**
2. Paste your referral link
3. You should see a banner: "🎉 You're signing up with a referral code!"
4. Sign up with a new account
5. After signup, check your referrals list

### C. Verify in Database

Run this query in Supabase SQL Editor:

```sql
-- Replace YOUR_USER_ID with your actual user_id
SELECT user_id, username, referred_by, created_at
FROM users
WHERE referred_by = 'YOUR_USER_ID';
```

You should see the new user you just created.

---

## ✅ Step 3: Check for Common Issues

### Issue 1: Column Doesn't Exist

**Symptom:** Error when signing up or viewing referrals

**Solution:**
```sql
-- Force add the column
ALTER TABLE users ADD COLUMN referred_by TEXT;
```

### Issue 2: Old Users Don't Have referred_by

**Symptom:** Existing users show NULL in referred_by

**Solution:** This is normal! Only new signups after adding the column will have a referrer.

To manually set a referrer for existing users:
```sql
UPDATE users 
SET referred_by = 'REFERRER_USER_ID'
WHERE user_id = 'REFERRED_USER_ID';
```

### Issue 3: Referral Code Not Being Captured

**Symptom:** Signup works but referred_by is NULL

**Check:**
1. Make sure you're using the full URL with `?ref=` parameter
2. Check browser console for errors
3. Verify the referral code is in the URL

**Debug:**
```javascript
// In LoginPage.js, add console.log
useEffect(() => {
  const refCode = searchParams.get('ref');
  console.log('Referral code from URL:', refCode); // Should show the user_id
  if (refCode) {
    setReferralCode(refCode);
  }
}, [searchParams]);
```

### Issue 4: Database Function Not Updated

**Symptom:** Signup works but referred_by not saved

**Solution:** Make sure `createUser` function includes `referred_by`:

```javascript
// In src/db/supabase.js
async createUser(userData) {
  const { user_id, username, email, avatar, is_admin, referred_by } = userData;
  
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert([{
      user_id,
      username,
      email: email || "",
      avatar,
      is_admin: is_admin || false,
      referred_by: referred_by || null, // ← This line is important!
      // ... other fields
    }])
    .select()
    .single();
}
```

---

## ✅ Step 4: Verify Data Flow

### Check Each Step:

1. **URL has referral code:**
   ```
   https://cipro1.vercel.app/login?ref=USR-123
   ```

2. **LoginPage detects it:**
   ```javascript
   console.log('Referral code:', referralCode); // Should show USR-123
   ```

3. **Passed to createUser:**
   ```javascript
   const newUser = await db.createUser({
     // ...
     referred_by: referralCode || null // Should be USR-123
   });
   ```

4. **Saved in database:**
   ```sql
   SELECT referred_by FROM users WHERE user_id = 'NEW_USER_ID';
   -- Should return: USR-123
   ```

5. **Shows in referrals list:**
   ```sql
   SELECT * FROM users WHERE referred_by = 'USR-123';
   -- Should return the new user
   ```

---

## ✅ Step 5: Manual Testing Queries

### Get All Referrals for a User

```sql
-- Replace YOUR_USER_ID
SELECT 
  user_id,
  username,
  avatar,
  created_at,
  last_login,
  points
FROM users
WHERE referred_by = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### Check Who Referred a User

```sql
-- Replace USER_ID
SELECT 
  u.user_id,
  u.username,
  u.avatar,
  r.user_id as referrer_id,
  r.username as referrer_name
FROM users u
LEFT JOIN users r ON u.referred_by = r.user_id
WHERE u.user_id = 'USER_ID';
```

### Get Referral Statistics

```sql
-- Replace YOUR_USER_ID
SELECT 
  COUNT(*) as total_referrals,
  COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as active_referrals
FROM users
WHERE referred_by = 'YOUR_USER_ID';
```

---

## ✅ Step 6: Force Refresh Data

If data isn't showing up in the UI:

1. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete`
   - Clear cached images and files
   - Reload page

2. **Hard refresh:**
   - Press `Ctrl+F5` (Windows)
   - Press `Cmd+Shift+R` (Mac)

3. **Check console for errors:**
   - Press `F12` to open DevTools
   - Go to Console tab
   - Look for any red errors

4. **Verify API calls:**
   - In DevTools, go to Network tab
   - Reload the Referral page
   - Look for calls to Supabase
   - Check if data is being returned

---

## ✅ Step 7: Common Error Messages

### "Column 'referred_by' does not exist"

**Solution:** Run the migration SQL:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;
```

### "Failed to load referral data"

**Check:**
1. Supabase connection is working
2. User is logged in
3. Database functions exist
4. RLS policies allow reading

**Fix RLS if needed:**
```sql
-- Allow reading referrals
CREATE POLICY "Allow users to read referrals" ON users
FOR SELECT USING (true);
```

### "Cannot read property 'userId' of undefined"

**Solution:** Make sure user object is passed to ReferralPage:
```javascript
<Route path="/referral" element={
  <ReferralPage user={user} addNotification={addNotification} />
} />
```

---

## ✅ Step 8: Test with Real Data

### Create Test Referral:

1. **Get your referral link** from the Referral page

2. **Share with a friend** or use incognito mode

3. **Sign up** using the referral link

4. **Check immediately:**
   ```sql
   SELECT user_id, username, referred_by 
   FROM users 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

5. **Refresh Referral page** - new user should appear

---

## ✅ Quick Fix Checklist

- [ ] Database column `referred_by` exists
- [ ] Index `idx_users_referred_by` exists
- [ ] `createUser` function includes `referred_by`
- [ ] LoginPage detects `?ref=` parameter
- [ ] Referral code is passed to `createUser`
- [ ] ReferralPage fetches data correctly
- [ ] No console errors
- [ ] Supabase connection works
- [ ] RLS policies allow reading

---

## 🆘 Still Not Working?

### Debug Mode:

Add console logs to track the flow:

```javascript
// In LoginPage.js
console.log('1. URL params:', searchParams.toString());
console.log('2. Referral code:', referralCode);

// In createUser call
console.log('3. Creating user with:', {
  username: formData.username,
  referred_by: referralCode
});

// After user created
console.log('4. User created:', newUser);
```

### Check Database Directly:

```sql
-- See all users and their referrers
SELECT 
  user_id,
  username,
  referred_by,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
```

### Verify Functions Exist:

```javascript
// In browser console on Referral page
console.log('getUserReferrals:', typeof db.getUserReferrals);
console.log('getReferrer:', typeof db.getReferrer);
console.log('getReferralStats:', typeof db.getReferralStats);
// All should show "function"
```

---

## 📞 Need More Help?

1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify all SQL migrations ran successfully
4. Test with a fresh signup using referral link
5. Check that latest code is deployed

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Referral link includes `?ref=USER_ID`
2. ✅ Signup page shows referral banner
3. ✅ New user has `referred_by` in database
4. ✅ Referral appears in referrer's list
5. ✅ Stats update correctly
6. ✅ Commission calculations work

---

**After following these steps, your referral system should be working perfectly!** 🎉
