# 🗺️ Cipro Navigation Structure

## 📱 Bottom Navigation (Always Visible on Mobile)
```
┌─────────────────────────────────────────────────────────┐
│  🎮      📋      🏆      🔔      👤                      │
│ MINING  TASKS   RANKS  ALERTS  ACCOUNT                  │
└─────────────────────────────────────────────────────────┘
```

## ☰ Hamburger Menu (Organized by Category)

### ⭐ Main Features
```
🎮 Mining Games      → /game (GamePage)
📋 Tasks             → /tasks (TasksPage)
🎁 Daily Rewards     → /daily-rewards (DailyRewardsPage)
```

### 💰 Earn More
```
🎁 Airdrop          → /airdrop (AirdropPage)
👥 Referral         → /referral (ReferralPage)
```

### 💳 Wallet
```
🔄 Convert & Withdraw → /conversion (ConversionPage)
```

### 🏆 Community
```
🏆 Leaderboard      → /leaderboard (LeaderboardPage)
🎖️ Achievements     → /achievements (AchievementsPage)
💎 VIP Tiers        → /vip-tiers (VIPTiersPage)
```

### ⚙️ Settings
```
👤 My Profile       → /profile (ProfilePage)
🔔 Notifications    → /notifications (NotificationsPage)
❓ FAQ              → /faq (FAQPage)
🚪 Logout           → (Logout action)
```

## 🛡️ Admin Navigation

### Admin Hamburger Menu
```
🛡️ Admin Panel
   └─ Dashboard     → /admin (AdminPage)
   
🚪 Logout
```

### Admin Dashboard Tabs
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Overview  💰 Revenue  👥 Users  🏆 Leaderboard       │
│ 💸 Withdrawals  🔔 Notifications  ⚙️ System  ⚠️ Danger  │
└─────────────────────────────────────────────────────────┘
```

## 🎮 GamePage Features

### Mining Modes (4 games)
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 🧩 Puzzle    │ 🎰 Spin      │ 🧠 Memory    │ ❓ Trivia    │
│ Challenge    │ Wheel        │ Match        │ Quiz         │
│ +50 CIPRO    │ +100 CIPRO   │ +120 CIPRO   │ +80 CIPRO    │
│ 30s cooldown │ 60s cooldown │ 45s cooldown │ 40s cooldown │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### 8-Hour Mining
```
┌─────────────────────────────────────────────────────────┐
│ ⛏️ 8-Hour Mining Session                                │
│ • Mine every 8 hours                                    │
│ • Base reward: 200 CIPRO                                │
│ • VIP multiplier bonus                                  │
└─────────────────────────────────────────────────────────┘
```

## 📊 Page Hierarchy

```
Cipro App
│
├── 🔐 Authentication
│   ├── Landing Page (/)
│   ├── Login Page (/login)
│   └── Admin Login (/admin/login)
│
├── 👤 User Dashboard
│   ├── 🎮 Main Features
│   │   ├── Game Mining (/)
│   │   ├── Tasks (/tasks)
│   │   └── Daily Rewards (/daily-rewards)
│   │
│   ├── 💰 Earning
│   │   ├── Airdrop (/airdrop)
│   │   └── Referral (/referral)
│   │
│   ├── 💳 Finance
│   │   └── Convert & Withdraw (/conversion)
│   │
│   ├── 🏆 Community
│   │   ├── Leaderboard (/leaderboard)
│   │   ├── Achievements (/achievements)
│   │   └── VIP Tiers (/vip-tiers)
│   │
│   └── ⚙️ Account
│       ├── Profile (/profile)
│       ├── Notifications (/notifications)
│       └── FAQ (/faq)
│
└── 🛡️ Admin Dashboard
    └── Admin Panel (/admin)
        ├── Overview Tab
        ├── Revenue Dashboard Tab
        ├── Users Management Tab
        ├── Leaderboard Tab
        ├── Withdrawals Tab
        ├── Notifications Tab
        ├── System Settings Tab
        └── Danger Zone Tab
```

## 🎯 Quick Access Guide

### For Players:
- **Start Earning**: Bottom Nav → 🎮 MINING
- **Complete Tasks**: Bottom Nav → 📋 TASKS
- **Check Rank**: Bottom Nav → 🏆 RANKS
- **View Alerts**: Bottom Nav → 🔔 ALERTS
- **Manage Account**: Bottom Nav → 👤 ACCOUNT

### For Admins:
- **View Stats**: Admin → 📊 Overview
- **Check Revenue**: Admin → 💰 Revenue Dashboard
- **Manage Users**: Admin → 👥 Users
- **Handle Withdrawals**: Admin → 💸 Withdrawals

## 📝 Navigation Best Practices

1. **Mobile First**: Bottom nav provides quick access to 5 most-used features
2. **Organized Menu**: Hamburger menu groups related features by category
3. **Clear Labels**: Each item has an emoji icon + descriptive text
4. **Logical Flow**: Features organized by user journey (Earn → Manage → Community)
5. **Admin Separation**: Admin features completely separated from user features
