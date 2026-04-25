# 🔥 Fix Production in 3 Steps

Your database works on **localhost** but not on **production** because Vercel doesn't have your database password.

---

## Step 1️⃣: Copy Your Database URL

Open your `.env` file and copy the `DATABASE_URL` line:

```
postgresql://your-username:your-password@ep-xxxxx.region.aws.neon.tech/your-database?sslmode=require
```

---

## Step 2️⃣: Add to Vercel

1. Go to: https://vercel.com/dashboard
2. Click your **Cipro** project
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Paste:
   - Name: `DATABASE_URL`
   - Value: (paste the line from Step 1)
   - Check ALL boxes: Production ✅ Preview ✅ Development ✅
6. Click **Save**

---

## Step 3️⃣: Redeploy

1. Go to **Deployments** tab
2. Click **...** on the latest deployment
3. Click **Redeploy**

**OR** just push to GitHub:
```bash
git commit --allow-empty -m "trigger redeploy"
git push
```

---

## ✅ Test It

Visit: https://www.ciprohub.site/api/debug

Should show:
```json
{
  "databaseConfigured": true,
  "databaseHealth": {
    "status": "healthy"
  }
}
```

**Done! Your site should work now.** 🎉

---

## 🆘 Still broken?

**Problem: "databaseConfigured": false**
- You didn't add DATABASE_URL correctly
- Go back to Step 2

**Problem: "status": "unhealthy"**
- Your Neon database is paused
- Go to https://console.neon.tech and wake it up

**Problem: Still seeing mock data**
- You didn't redeploy after adding the variable
- Go back to Step 3

---

## 📞 Need the full guide?

See: `VERCEL-DATABASE-FIX.md` for detailed instructions
