# 🚀 Quick Start Guide - Cipro

## ✅ Your App is Running!

**Local URL**: http://localhost:3001/

---

## ⚠️ Current Issues & Solutions

### Issue 1: No Internet Connection
**Error**: `net::ERR_INTERNET_DISCONNECTED`

**Solution**: 
- Connect to the internet
- The app needs to reach Supabase database at `yafswrgnzepfjtaeibep.supabase.co`

---

### Issue 2: Missing Database Tables
**Error**: `user_sessions` table not found

**Solution**: Run the SQL updates in your Supabase dashboard

#### Step-by-Step:

1. **Connect to Internet** ✅

2. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login to your account
   - Select your project: `yafswrgnzepfjtaeibep`

3. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

4. **Run Main Schema** (if not already done)
   - Open file: `src/db/supabase-schema.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run" or press `Ctrl+Enter`
   - Wait for success message

5. **Run Database Updates**
   - Open file: `COMPLETE-DATABASE-UPDATE.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run" or press `Ctrl+Enter`
   - Wait for success message

6. **Run Subscription System**
   - Open file: `VIP-SUBSCRIPTION-SYSTEM.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run" or press `Ctrl+Enter`
   - Wait for success message

7. **Initialize Leaderboard**
   ```sql
   SELECT update_leaderboard_cache();
   ```

8. **Refresh Your Browser**
   - Go back to http://localhost:3001/
   - Press `Ctrl+R` or `F5`
   - Errors should be gone!

---

## 🎮 Testing the App

### 1. Create an Account
- Click "Get Started" or "Login"
- Enter username and email
- Click "Login"

### 2. Explore Features

#### Game Mining
- Go to: http://localhost:3001/game
- Play the 4 mining games
- Check daily limits (5 games for Bronze)
- Try 8-hour mining

#### VIP Tiers (NEW!)
- Go to: http://localhost:3001/vip-tiers
- See subscription pricing
- Toggle Monthly/Yearly billing
- Check benefits comparison
- Click "Subscribe Now" (shows notification)

#### Activity Feed (NEW!)
- Scroll down on Game page
- See live activity feed
- Watch activities update
- Try filtering by type

#### Daily Rewards
- Go to: http://localhost:3001/daily-rewards
- Claim your daily reward
- Build your streak
- See milestone rewards

#### Tasks
- Go to: http://localhost:3001/tasks
- View daily/weekly/monthly tasks
- Complete tasks
- Claim rewards

#### Leaderboard
- Go to: http://localhost:3001/leaderboard
- See top players
- Check your rank
- View activity feed at bottom

#### Profile
- Go to: http://localhost:3001/profile
- View your stats
- Check balances
- See achievements

---

## 🔧 Troubleshooting

### App Won't Load
**Check**:
1. Is the dev server running? (Should see webpack output)
2. Is http://localhost:3001/ accessible?
3. Any console errors?

**Solution**: Restart dev server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm start
```

### Database Errors
**Check**:
1. Are you connected to internet?
2. Is Supabase URL correct in `.env`?
3. Have you run the SQL scripts?

**Solution**: 
1. Connect to internet
2. Run all SQL scripts in Supabase
3. Refresh browser

### Features Not Working
**Check**:
1. Are all SQL scripts run?
2. Is database connection working?
3. Any console errors?

**Solution**:
1. Run all 3 SQL files
2. Check Supabase dashboard
3. Check browser console

---

## 📊 What's Working (Offline Mode)

Even without database connection, you can see:
- ✅ Landing page
- ✅ Login page UI
- ✅ Navigation structure
- ✅ Page layouts
- ✅ Styling and animations

**But you need database for**:
- ❌ User authentication
- ❌ Saving progress
- ❌ Game limits
- ❌ Leaderboards
- ❌ Activity feed

---

## 🎯 Quick Commands

### Start Development Server
```bash
npm start
```
**URL**: http://localhost:3001/

### Build for Production
```bash
npm run build
```
**Output**: `dist/` folder

### Stop Development Server
Press `Ctrl+C` in terminal

---

## 📝 Files to Run in Supabase

**In this order**:

1. **src/db/supabase-schema.sql**
   - Main database schema
   - All core tables
   - Seed data

2. **COMPLETE-DATABASE-UPDATE.sql**
   - Missing tables
   - New columns
   - Functions and views

3. **VIP-SUBSCRIPTION-SYSTEM.sql**
   - Subscription tables
   - Payment tracking
   - Subscription functions

**Total time**: ~2-3 minutes

---

## ✅ Checklist

### Before Testing
- [ ] Internet connected
- [ ] Supabase SQL scripts run
- [ ] Dev server running
- [ ] Browser open to http://localhost:3001/

### After Setup
- [ ] Can create account
- [ ] Can play games
- [ ] Can see activity feed
- [ ] Can view VIP tiers with pricing
- [ ] Can complete tasks
- [ ] Can claim daily rewards

---

## 🎉 Once Database is Set Up

Your app will have:
- ✅ Full user authentication
- ✅ Game mining with limits
- ✅ 8-hour mining system
- ✅ Daily rewards & streaks
- ✅ Live activity feed
- ✅ VIP subscription system
- ✅ Tasks & achievements
- ✅ Leaderboards
- ✅ Referral system
- ✅ Conversion & withdrawals
- ✅ Admin dashboard

---

## 🌐 URLs Reference

| Page | URL |
|------|-----|
| Landing | http://localhost:3001/ |
| Login | http://localhost:3001/login |
| Game Mining | http://localhost:3001/game |
| Tasks | http://localhost:3001/tasks |
| Daily Rewards | http://localhost:3001/daily-rewards |
| VIP Tiers | http://localhost:3001/vip-tiers |
| Leaderboard | http://localhost:3001/leaderboard |
| Profile | http://localhost:3001/profile |
| Airdrop | http://localhost:3001/airdrop |
| Referral | http://localhost:3001/referral |
| Conversion | http://localhost:3001/conversion |
| Achievements | http://localhost:3001/achievements |
| Notifications | http://localhost:3001/notifications |
| FAQ | http://localhost:3001/faq |
| Admin Login | http://localhost:3001/admin/login |
| Admin Panel | http://localhost:3001/admin |

---

## 💡 Pro Tips

1. **Use Demo Login** - Quick way to test features
2. **Check Console** - See what's happening
3. **Test Mobile View** - Resize browser or use DevTools
4. **Try Dark Mode** - Toggle in header
5. **Test All Features** - Click around and explore

---

## 🎊 Summary

**Your Cipro app is running on localhost!**

**Next Steps**:
1. ✅ Connect to internet
2. ✅ Run SQL scripts in Supabase
3. ✅ Refresh browser
4. ✅ Start testing!

**Happy testing! 🚀**
