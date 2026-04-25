# 🔧 Fix Production Database Connection

## Problem
Database works on localhost but not on production (Vercel).

## Root Cause
The `DATABASE_URL` environment variable is either:
1. Not set in Vercel
2. Set incorrectly
3. Using wrong format
4. Database not allowing connections from Vercel IPs

---

## ✅ Solution: Step-by-Step Fix

### Step 1: Get Your Neon Database Connection String

1. Go to https://console.neon.tech
2. Select your Cipro project
3. Click on "Dashboard" or "Connection Details"
4. Copy the connection string

It should look like:
```
postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Important**: Make sure it includes `?sslmode=require` at the end!

---

### Step 2: Add Environment Variable to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your Cipro project
3. Click "Settings" tab
4. Click "Environment Variables" in the left sidebar
5. Click "Add New" button
6. Fill in:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon connection string (from Step 1)
   - **Environment**: Check all three boxes (Production, Preview, Development)
7. Click "Save"

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login
vercel login

# Add environment variable
vercel env add DATABASE_URL
# Paste your connection string when prompted
# Select: Production, Preview, Development (all)
```

---

### Step 3: Redeploy Your Application

After adding the environment variable, you MUST redeploy:

#### Option A: Via Dashboard
1. Go to your Vercel project
2. Click "Deployments" tab
3. Click the three dots (...) on the latest deployment
4. Click "Redeploy"
5. Check "Use existing Build Cache" (optional)
6. Click "Redeploy"

#### Option B: Via Git Push
```bash
# Make a small change or empty commit
git commit --allow-empty -m "Trigger redeploy with DATABASE_URL"
git push origin main
```

#### Option C: Via Vercel CLI
```bash
vercel --prod
```

---

### Step 4: Verify Environment Variable is Set

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. You should see `DATABASE_URL` listed
3. Value should be hidden (shows as `***`)
4. Should be enabled for Production, Preview, and Development

---

### Step 5: Test the Connection

#### Test 1: Health Check Endpoint
Visit: `https://www.ciprohub.site/api/db?action=health`

**Expected Response (Success):**
```json
{
  "status": "healthy",
  "connected": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "PostgreSQL 15.1"
}
```

**If you see this, database is connected! ✅**

**Expected Response (Failure):**
```json
{
  "status": "unhealthy",
  "connected": false,
  "error": "connection error message"
}
```

#### Test 2: Try to Sign Up
1. Go to https://www.ciprohub.site/login
2. Click "Sign Up" tab
3. Try to create an account
4. If it works, database is connected!

#### Test 3: Check Vercel Logs
```bash
# Via CLI
vercel logs --prod

# Or via Dashboard
# Go to Deployments → Click latest → View Function Logs
```

Look for:
- ✅ "Database connected successfully"
- ❌ "Database connection error"
- ❌ "DATABASE_URL environment variable is not set"

---

## 🔍 Common Issues & Solutions

### Issue 1: "DATABASE_URL is not set"

**Solution:**
- Environment variable not added to Vercel
- Follow Step 2 above
- Make sure to redeploy after adding

### Issue 2: "Connection refused" or "ECONNREFUSED"

**Solution:**
- Database might be paused (Neon free tier)
- Go to Neon console and wake up the database
- Wait 30 seconds and try again

### Issue 3: "password authentication failed"

**Solution:**
- Wrong username or password in connection string
- Get fresh connection string from Neon
- Make sure to copy the entire string including password

### Issue 4: "no pg_hba.conf entry"

**Solution:**
- Missing `?sslmode=require` in connection string
- Add it to the end of your DATABASE_URL:
  ```
  postgresql://user:pass@host/db?sslmode=require
  ```

### Issue 5: "relation does not exist"

**Solution:**
- Database tables not created
- Follow PRODUCTION-SETUP.md to create tables
- Run DATABASE-SETUP.sql in Neon SQL Editor

### Issue 6: Works in Preview but not Production

**Solution:**
- Environment variable might only be set for Preview
- Check Vercel Settings → Environment Variables
- Make sure "Production" checkbox is checked
- Redeploy to production

---

## 🧪 Testing Checklist

After following the steps above, verify:

- [ ] `DATABASE_URL` is visible in Vercel Environment Variables
- [ ] Environment variable is enabled for Production
- [ ] Application has been redeployed after adding variable
- [ ] Health check endpoint returns "healthy"
- [ ] Can create a new user account
- [ ] Data persists after page refresh
- [ ] Leaderboard shows real users (not mock data)
- [ ] No 500 errors in browser console

---

## 📋 Verification Commands

### Check if DATABASE_URL is set (locally)
```bash
# This checks your local .env file
cat .env | grep DATABASE_URL
```

### Check Vercel environment variables
```bash
vercel env ls
```

### Test database connection locally
```bash
# Install psql if you haven't
# Then test connection
psql $DATABASE_URL -c "SELECT version();"
```

---

## 🎯 Quick Checklist

**Before deploying:**
- [ ] DATABASE_URL is in your local .env file
- [ ] Database works on localhost
- [ ] Tables are created in database

**In Vercel:**
- [ ] DATABASE_URL is added to Environment Variables
- [ ] Variable is enabled for Production
- [ ] Application has been redeployed
- [ ] Health check endpoint works

**After deploying:**
- [ ] No 500 errors on production site
- [ ] Can create user accounts
- [ ] Data persists
- [ ] All features work

---

## 🚨 Still Not Working?

### Debug Steps:

1. **Check Vercel Function Logs**
   - Go to Vercel Dashboard
   - Click on your deployment
   - Click "Functions" tab
   - Look for `/api/db` function
   - Check the logs for errors

2. **Verify Connection String Format**
   ```
   postgresql://[username]:[password]@[host]:[port]/[database]?sslmode=require
   ```
   
   Example:
   ```
   postgresql://myuser:mypass123@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

3. **Test with Mock Data First**
   - Add environment variable: `USE_MOCK_DATA=true`
   - Redeploy
   - Site should work with mock data
   - Then fix database connection

4. **Check Neon Database Status**
   - Free tier databases pause after inactivity
   - Go to Neon console
   - Check if database is "Active"
   - If paused, click to wake it up

5. **Verify Database Tables Exist**
   - Go to Neon SQL Editor
   - Run: `SELECT COUNT(*) FROM users;`
   - If error, tables don't exist
   - Run DATABASE-SETUP.sql

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs/environment-variables
- **Neon Docs**: https://neon.tech/docs/connect/connect-from-any-app
- **PostgreSQL Connection Strings**: https://www.postgresql.org/docs/current/libpq-connect.html

---

## ✅ Success!

Once everything is working, you should see:
- ✅ No 500 errors
- ✅ Health check returns "healthy"
- ✅ Can create and login to accounts
- ✅ Data persists across sessions
- ✅ Leaderboard shows real users
- ✅ All features functional

**Your production database is now connected! 🎉**
