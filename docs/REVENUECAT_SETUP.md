# 💰 RevenueCat Setup Guide - AthleticaAI Mobile

Complete step-by-step guide to configure RevenueCat subscriptions for iOS and Android.

---

## 📋 Prerequisites

- Apple Developer Account ($99/year) - For iOS
- Google Play Console Account ($25 one-time) - For Android
- RevenueCat Account (Free tier available)
- Xcode (for iOS) / Android Studio (for Android)

---

## 🚀 Part 1: RevenueCat Dashboard Setup

### Step 1: Create RevenueCat Account

1. Go to [RevenueCat](https://www.revenuecat.com/)
2. Sign up for free account
3. Create new project: **"AthleticaAI"**

### Step 2: Add Apps

#### iOS App Setup
1. In RevenueCat dashboard → **Apps** → **Add App**
2. Select **iOS**
3. **Bundle ID**: `com.athleticaai.mobile` (change to your actual bundle ID)
4. **App name**: AthleticaAI iOS
5. Click **Create**

#### Android App Setup
1. **Apps** → **Add App**
2. Select **Android**
3. **Package name**: `com.athleticaai.mobile` (change to your actual package)
4. **App name**: AthleticaAI Android
5. Click **Create**

### Step 3: Get API Keys

1. Go to **App Settings** → **API Keys**
2. Copy **Public SDK Key (iOS)** → Starts with `appl_`
3. Copy **Public SDK Key (Android)** → Starts with `goog_`
4. Add to `.env`:
   ```bash
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_YOUR_KEY_HERE
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_YOUR_KEY_HERE
   ```

---

## 📦 Part 2: App Store Connect Configuration (iOS)

### Step 1: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. **Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: AthleticaAI
   - **Primary Language**: English
   - **Bundle ID**: `com.athleticaai.mobile`
   - **SKU**: `athleticaai-mobile-001`
4. Click **Create**

### Step 2: Create Subscription Products

1. In your app → **Features** → **In-App Purchases** → **+**
2. Select **Auto-Renewable Subscription**

#### Product 1: Monthly Plan
- **Reference Name**: AthleticaAI Pro Monthly
- **Product ID**: `athletica_pro_monthly` ⚠️ (must match code)
- **Subscription Group**: AthleticaAI Pro (create new)
- **Subscription Duration**: 1 Month
- **Price**: $14.99 USD

#### Product 2: Annual Plan
- **Reference Name**: AthleticaAI Pro Annual
- **Product ID**: `athletica_pro_annual` ⚠️ (must match code)
- **Subscription Group**: AthleticaAI Pro (same as above)
- **Subscription Duration**: 1 Year
- **Price**: $89.99 USD (50% savings)

### Step 3: Configure Free Trial

1. In each product → **Subscription Prices**
2. Enable **Introductory Offers**
3. Select **Free Trial**
4. Duration: **7 days**
5. Save

### Step 4: Add Subscription to RevenueCat

1. Back to RevenueCat dashboard
2. **Products** → **+** → **iOS**
3. Select your iOS app
4. **Product ID**: `athletica_pro_monthly` (enter manually if not showing)
5. Click **Add**
6. Repeat for `athletica_pro_annual`

---

## 🤖 Part 3: Google Play Console Configuration (Android)

### Step 1: Create App

1. Go to [Google Play Console](https://play.google.com/console/)
2. **Create App**
3. Fill in:
   - **App name**: AthleticaAI
   - **Default language**: English
   - **App or game**: App
   - **Free or paid**: Free
4. Click **Create App**

### Step 2: Create Subscription Products

1. **Monetize** → **Subscriptions** → **Create subscription**
2. **Product ID**: `athletica_pro_monthly` ⚠️ (must match code)
3. **Name**: AthleticaAI Pro Monthly
4. **Description**: Unlimited AI workouts, custom programs, and premium features
5. **Billing period**: 1 month
6. **Price**: $14.99 USD

#### Free Trial Configuration
1. In subscription → **Free trial**
2. Enable free trial
3. **Free trial period**: 7 days
4. Save

#### Annual Plan
1. Create another subscription
2. **Product ID**: `athletica_pro_annual`
3. **Billing period**: 1 year
4. **Price**: $89.99 USD
5. Enable 7-day free trial

### Step 3: Link to RevenueCat

1. RevenueCat dashboard → **Products** → **+** → **Android**
2. Select your Android app
3. **Product ID**: `athletica_pro_monthly`
4. Click **Add**
5. Repeat for `athletica_pro_annual`

---

## 🎁 Part 4: Create Offerings in RevenueCat

### What are Offerings?
Offerings are collections of products that you show to users. You can have multiple offerings for A/B testing.

### Step 1: Create Default Offering

1. RevenueCat dashboard → **Offerings** → **New Offering**
2. **Identifier**: `default`
3. **Description**: Default subscription offering
4. Click **Create**

### Step 2: Add Packages to Offering

1. In "default" offering → **Packages** → **Add Package**

#### Package 1: Monthly
- **Identifier**: `monthly`
- **Product**: Select `athletica_pro_monthly` (iOS and Android)
- Click **Add**

#### Package 2: Annual (Recommended)
- **Identifier**: `annual`
- **Product**: Select `athletica_pro_annual` (iOS and Android)
- **Mark as default** ✅
- Click **Add**

### Step 3: Set as Current Offering
1. In offerings list → Set `default` as **Current**
2. This is what users will see in the app

---

## 🔐 Part 5: Configure Entitlements

### What are Entitlements?
Entitlements represent access levels (e.g., "pro"). Products grant entitlements.

### Step 1: Create Entitlement

1. RevenueCat dashboard → **Entitlements** → **New Entitlement**
2. **Identifier**: `pro` ⚠️ (must match code: `ENTITLEMENT_ID = 'pro'`)
3. **Description**: Premium features access
4. Click **Create**

### Step 2: Attach Products to Entitlement

1. Click on `pro` entitlement
2. **Products** → **Attach Products**
3. Select:
   - `athletica_pro_monthly` (iOS)
   - `athletica_pro_monthly` (Android)
   - `athletica_pro_annual` (iOS)
   - `athletica_pro_annual` (Android)
4. Save

Now when a user purchases any subscription, they get the `pro` entitlement!

---

## 🧪 Part 6: Testing in Sandbox

### iOS Sandbox Testing

1. **Create Sandbox Tester**:
   - App Store Connect → **Users and Access** → **Sandbox Testers** → **+**
   - Create test Apple ID (use `+` trick: `yourname+test@gmail.com`)

2. **Sign Out of Real Apple ID**:
   - iOS Settings → App Store → Sign Out

3. **Run App in Simulator/Device**:
   ```bash
   npm run ios
   ```

4. **Trigger Purchase**:
   - Navigate to paywall
   - Select plan → Purchase
   - Sign in with sandbox tester account
   - Confirm purchase (FREE in sandbox)

5. **Verify Purchase**:
   - Check RevenueCat dashboard → **Customers** → See test purchase
   - In app: Premium features should unlock

### Android Sandbox Testing

1. **Add License Testers**:
   - Google Play Console → **Setup** → **License Testing**
   - Add test Gmail accounts

2. **Create Internal Test Track**:
   - **Testing** → **Internal Testing** → **Create release**
   - Upload signed APK/AAB
   - Add testers

3. **Test Purchase**:
   - Install from internal test link
   - Navigate to paywall
   - Purchase (using test card: `4242 4242 4242 4242`)

---

## ✅ Part 7: Verify Integration

### Check RevenueCat Dashboard

1. **Customers**: Should see test purchases
2. **Revenue**: Charts should show test transactions
3. **Products**: All products active ✅
4. **Offerings**: Default offering set ✅
5. **Entitlements**: `pro` entitlement configured ✅

### Check App

1. **Launch app** → Navigate to Profile tab
2. **Not Premium**: Should see "Upgrade to Premium" gold card
3. **Click "Upgrade to Premium"** → Paywall opens
4. **Packages Load**: Should see real prices (not mock)
5. **Purchase**: Select plan → Purchase → Should succeed
6. **Premium Unlocked**: Gold card disappears, profile shows Premium badge
7. **AI Generator**: Should show "Unlimited" instead of "3/day"

---

## 🚨 Common Issues & Solutions

### Issue 1: "No packages available"
**Cause**: Offerings not configured or API keys wrong
**Fix**:
- Verify API keys in `.env` are correct
- Check offerings in RevenueCat dashboard
- Restart Expo dev server

### Issue 2: "Purchase failed"
**Cause**: Product IDs mismatch
**Fix**:
- Verify product IDs match EXACTLY:
  - Code: `athletica_pro_monthly`, `athletica_pro_annual`
  - App Store Connect: Same
  - Google Play: Same
  - RevenueCat: Same

### Issue 3: "Entitlement not granted after purchase"
**Cause**: Products not attached to entitlement
**Fix**:
- RevenueCat → Entitlements → `pro` → Attach Products
- Attach ALL products (iOS + Android, Monthly + Annual)

### Issue 4: "Sandbox tester already purchased"
**Cause**: Need to clear purchase history
**Fix**:
- iOS: Settings → App Store → Sandbox Account → Manage → Clear Purchase History
- Or create new sandbox tester

---

## 📊 Part 8: Production Deployment

### Before Launch Checklist

- [ ] All products approved in App Store Connect (Status: Ready to Submit)
- [ ] All products approved in Google Play Console (Status: Active)
- [ ] RevenueCat webhooks configured (if needed)
- [ ] Privacy policy updated (mention subscriptions)
- [ ] Terms of service updated (cancellation policy)
- [ ] Restore purchases tested
- [ ] Cancellation flow tested
- [ ] Receipt validation working
- [ ] Analytics events tracked (purchase, cancel, restore)

### After Launch

1. **Monitor RevenueCat Dashboard**:
   - Revenue charts
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - Trial conversion rate

2. **A/B Test Offerings**:
   - Create alternative offerings
   - Test different pricing
   - Test different trial periods
   - Measure conversion rates

3. **Optimize Paywall**:
   - Track which features drive conversions
   - Update social proof numbers
   - Test different copy

---

## 🎯 Expected Results

**Free Trial Conversion**: 40-60% (industry standard)
**Monthly Churn**: < 5% (good)
**Annual vs Monthly**: 60-70% choose annual (if positioned well)
**LTV (Lifetime Value)**: $300-500 per premium user

---

## 📚 Resources

- [RevenueCat Docs](https://docs.revenuecat.com/)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [React Native Purchases SDK](https://github.com/RevenueCat/react-native-purchases)

---

## 🆘 Support

If stuck, check:
1. RevenueCat Community: https://community.revenuecat.com/
2. RevenueCat Support: support@revenuecat.com
3. SDK Issues: GitHub issues

---

**🎉 Setup Complete! Your app is ready to generate revenue! 💰**
