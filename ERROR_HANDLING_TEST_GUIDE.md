# 🧪 ERROR HANDLING TEST GUIDE

Complete testing guide for error handling implementation in AthleticaAI Mobile.

---

## 📋 PRE-TEST CHECKLIST

- [ ] App builds successfully (`npx expo start`)
- [ ] TypeScript has 0 errors (`npm run typecheck`)
- [ ] All critical screens load without crashes
- [ ] User is signed in

---

## 🧪 TEST SUITE 1: Network Errors

### Test 1.1: Airplane Mode - Home Screen
**Steps:**
1. Open app and navigate to Home screen
2. Enable Airplane Mode on device
3. Pull to refresh

**Expected Result:**
- ✅ Toast notification: "Failed to load..." appears
- ✅ ErrorState component displays with:
  - Icon: alert-circle or wifi-off
  - Title: "Connection Error"
  - Description: "Please check your internet connection and try again."
  - Retry button visible
- ✅ No app crash

**Actual Result:** ___________

---

### Test 1.2: Network Error - Retry Functionality
**Steps:**
1. With Airplane Mode ON, tap retry button on ErrorState
2. Disable Airplane Mode
3. Tap retry button again

**Expected Result:**
- ✅ First retry: Haptic feedback, loading state, error persists
- ✅ Second retry: Haptic feedback, loading state, data loads successfully
- ✅ ErrorState disappears, content shows

**Actual Result:** ___________

---

### Test 1.3: Network Timeout - Progress Screen
**Steps:**
1. Navigate to Progress tab
2. Simulate slow network (Network Link Conditioner on iOS, Network Throttling on Android)
3. Pull to refresh

**Expected Result:**
- ✅ Loading skeleton appears
- ✅ After timeout (~30s), ErrorState shows
- ✅ Error message mentions connection/timeout

**Actual Result:** ___________

---

## 🧪 TEST SUITE 2: Database Errors

### Test 2.1: Invalid Workout ID
**Steps:**
1. Manually navigate to `/workout-player/invalid-id-123`
2. Observe behavior

**Expected Result:**
- ✅ ErrorState component displays
- ✅ Title: "Not Found" or "Failed to load workout"
- ✅ Retry button visible
- ✅ No app crash

**Actual Result:** ___________

---

### Test 2.2: Invalid Program ID
**Steps:**
1. Navigate to `/programs/invalid-program-id/dashboard`
2. Observe behavior

**Expected Result:**
- ✅ ErrorState displays
- ✅ User-friendly error message
- ✅ Retry or back navigation available

**Actual Result:** ___________

---

### Test 2.3: Empty Data State
**Steps:**
1. Navigate to Achievements screen with new account (0 achievements)
2. Observe behavior

**Expected Result:**
- ✅ Shows empty state OR list with 0 items
- ✅ NOT an error state (empty data ≠ error)
- ✅ No crash

**Actual Result:** ___________

---

## 🧪 TEST SUITE 3: Error State UI/UX

### Test 3.1: Compact ErrorState (Cards)
**Steps:**
1. Force error on Home screen Program Card
2. Observe ErrorState in compact mode

**Expected Result:**
- ✅ Smaller error display (fits within card)
- ✅ Retry button present
- ✅ Message is concise
- ✅ Doesn't break layout

**Actual Result:** ___________

---

### Test 3.2: Full ErrorState (Screens)
**Steps:**
1. Force error on Achievements screen
2. Observe ErrorState in full mode

**Expected Result:**
- ✅ Centered error display
- ✅ Larger icon
- ✅ Full title and description
- ✅ Prominent retry button
- ✅ FadeInDown animation plays

**Actual Result:** ___________

---

### Test 3.3: Haptic Feedback
**Steps:**
1. Display ErrorState with retry button
2. Tap retry button
3. Feel for haptic feedback

**Expected Result:**
- ✅ Light haptic feedback on tap (iOS/Android)
- ✅ Feels responsive and immediate

**Actual Result:** ___________

---

### Test 3.4: Dark Mode
**Steps:**
1. Display ErrorState in light mode
2. Toggle to dark mode
3. Observe colors and contrast

**Expected Result:**
- ✅ Text is readable in both modes
- ✅ Background colors adapt
- ✅ Icon color adapts
- ✅ Button colors adapt

**Actual Result:** ___________

---

## 🧪 TEST SUITE 4: Error Types

### Test 4.1: Auth Error
**Steps:**
1. Sign out while on a screen
2. Try to refresh data

**Expected Result:**
- ✅ ErrorState shows "Authentication Error"
- ✅ Message suggests signing in again
- ✅ App redirects to sign-in OR shows clear action

**Actual Result:** ___________

---

### Test 4.2: Rate Limit Error (AI Generator)
**Steps:**
1. Generate multiple AI workouts rapidly (if rate limiting is enabled)
2. Observe error message

**Expected Result:**
- ✅ ErrorState shows "Too Many Requests"
- ✅ Message suggests waiting
- ✅ Retry button disabled OR shows wait time

**Actual Result:** ___________

---

### Test 4.3: Data Validation Error
**Steps:**
1. Submit invalid data (if applicable)
2. Observe error handling

**Expected Result:**
- ✅ Error message is specific to validation failure
- ✅ User knows what to fix
- ✅ No generic "Something went wrong"

**Actual Result:** ___________

---

## 🧪 TEST SUITE 5: Loading → Error → Success Flow

### Test 5.1: Full Flow - Home Screen
**Steps:**
1. Fresh app load
2. Observe loading state
3. Let data load successfully

**Expected Result:**
- ✅ Skeleton loaders appear first
- ✅ Smooth transition to content
- ✅ No error state shown

**Actual Result:** ___________

---

### Test 5.2: Loading → Error Flow
**Steps:**
1. Enable Airplane Mode
2. Refresh Home screen
3. Observe transition

**Expected Result:**
- ✅ Loading skeleton appears
- ✅ Transitions to ErrorState smoothly
- ✅ No flash of content

**Actual Result:** ___________

---

### Test 5.3: Error → Loading → Success Flow
**Steps:**
1. Display ErrorState (Airplane Mode)
2. Disable Airplane Mode
3. Tap retry
4. Observe full flow

**Expected Result:**
- ✅ ErrorState → Loading skeleton → Content
- ✅ Smooth animations throughout
- ✅ No flashing or jank

**Actual Result:** ___________

---

## 🧪 TEST SUITE 6: Critical User Flows

### Test 6.1: Home → Workout Player
**Steps:**
1. Navigate to Home
2. Tap "Workout of the Day"
3. Force network error during load

**Expected Result:**
- ✅ ErrorState shows in workout player
- ✅ Can retry to load workout
- ✅ Can navigate back

**Actual Result:** ___________

---

### Test 6.2: Progress Tab
**Steps:**
1. Navigate to Progress tab
2. Force error loading stats
3. Observe all sections

**Expected Result:**
- ✅ ErrorState shows for stats section
- ✅ ErrorState shows for weekly chart
- ✅ Each section has independent retry
- ✅ No full-screen crash

**Actual Result:** ___________

---

### Test 6.3: Achievements Screen
**Steps:**
1. Navigate to Achievements
2. Force error loading achievements
3. Tap retry

**Expected Result:**
- ✅ Full ErrorState displays
- ✅ Retry reloads achievements
- ✅ Success shows achievement grid

**Actual Result:** ___________

---

## 🧪 TEST SUITE 7: Edge Cases

### Test 7.1: Multiple Simultaneous Errors
**Steps:**
1. Navigate to Home (loads 4 data sources)
2. Enable Airplane Mode
3. Refresh
4. Observe all sections

**Expected Result:**
- ✅ Multiple ErrorStates can display simultaneously
- ✅ Each has independent retry
- ✅ No layout breaks

**Actual Result:** ___________

---

### Test 7.2: Rapid Retry
**Steps:**
1. Display ErrorState
2. Tap retry button rapidly 5 times

**Expected Result:**
- ✅ Only one request triggered
- ✅ No duplicate errors
- ✅ Loading state prevents multiple taps

**Actual Result:** ___________

---

### Test 7.3: Error During Navigation
**Steps:**
1. Tap workout card on Home
2. Immediately enable Airplane Mode
3. Observe navigation and error

**Expected Result:**
- ✅ Navigation completes
- ✅ ErrorState shows on destination
- ✅ Can navigate back

**Actual Result:** ___________

---

## 📊 TEST RESULTS SUMMARY

| Test Suite | Passed | Failed | N/A |
|------------|--------|--------|-----|
| Suite 1: Network Errors | __ / 3 | __ / 3 | __ |
| Suite 2: Database Errors | __ / 3 | __ / 3 | __ |
| Suite 3: Error State UI/UX | __ / 4 | __ / 4 | __ |
| Suite 4: Error Types | __ / 3 | __ / 3 | __ |
| Suite 5: Loading → Error → Success | __ / 3 | __ / 3 | __ |
| Suite 6: Critical User Flows | __ / 3 | __ / 3 | __ |
| Suite 7: Edge Cases | __ / 3 | __ / 3 | __ |
| **TOTAL** | **__ / 22** | **__ / 22** | **__** |

---

## ✅ ACCEPTANCE CRITERIA

To pass error handling testing, the following must be true:

- [ ] **No app crashes** on any error scenario
- [ ] **All ErrorStates display** user-friendly messages
- [ ] **Retry functionality works** in all cases
- [ ] **Haptic feedback** works on retry button
- [ ] **Animations are smooth** (no jank)
- [ ] **Dark mode support** works correctly
- [ ] **Toast + ErrorState** both appear appropriately
- [ ] **Loading → Error → Success** flow is smooth
- [ ] **Critical flows** (Home, Workout Player, Progress) work
- [ ] **TypeScript has 0 errors** after changes

---

## 🐛 BUG REPORT TEMPLATE

If issues are found, use this template:

```
**Bug ID:** BUG-ERR-001
**Severity:** Critical/High/Medium/Low
**Test Case:** [Test number and name]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots/Video:**
[Attach if possible]

**Environment:**
- Device: [iPhone 15 Pro / Pixel 8 / etc.]
- OS Version: [iOS 17.2 / Android 14 / etc.]
- App Version: [1.0.0]

**Additional Context:**
[Any other relevant information]
```

---

## 📝 NOTES

- Test on both iOS and Android
- Test on different device sizes (small phone, tablet if applicable)
- Test with slow network (3G simulation)
- Test with VoiceOver/TalkBack for accessibility
- Document any platform-specific issues

---

**Tester:** ___________
**Date:** ___________
**Build Version:** ___________
**Pass/Fail:** ___________
