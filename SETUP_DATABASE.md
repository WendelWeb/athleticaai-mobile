# 🔧 Database Setup - URGENT ACTION REQUIRED

## ⚠️ Critical Error Fixed

The error `DATABASE_URL environment variable is not set` has been fixed with lazy initialization.

## 🚀 What You Need To Do NOW

### 1. Update Your `.env` File

Open your `.env` file and **ADD** this line (with your actual Neon PostgreSQL URL):

```bash
EXPO_PUBLIC_DATABASE_URL=postgresql://user:password@your-project.neon.tech/athleticaai?sslmode=require
```

**IMPORTANT**:
- Use the **SAME value** as your existing `DATABASE_URL`
- The `EXPO_PUBLIC_` prefix makes it accessible in React Native
- Keep BOTH variables (DATABASE_URL for Node.js scripts, EXPO_PUBLIC_DATABASE_URL for the app)

### 2. Example `.env` Configuration

```bash
# For Node.js scripts (migrations, seed data)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/athleticaai?sslmode=require

# For React Native app (REQUIRED)
EXPO_PUBLIC_DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/athleticaai?sslmode=require
```

### 3. Restart Your Development Server

After adding `EXPO_PUBLIC_DATABASE_URL` to your `.env`:

```bash
# Stop current server (Ctrl+C)
npm start
```

The error will disappear! ✅

---

## 🔍 What Changed?

### Before (❌ Crashed on load):
```typescript
// Direct initialization at top-level
const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set'); // 💥 Crash!
}
```

### After (✅ Lazy initialization):
```typescript
// Lazy initialization with Proxy - only loads when used
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const instance = getDbInstance(); // Loads on first use
    if (!instance) {
      throw new Error('Database not configured');
    }
    return instance[prop];
  }
});
```

### Why This Works:
1. **No top-level crash**: The database initializes only when first used, not during module load
2. **Supports both environments**: Works in React Native (EXPO_PUBLIC_DATABASE_URL) and Node.js (DATABASE_URL)
3. **Helpful warnings**: If not configured, shows clear console warnings instead of crashing

---

## 🔒 Security Note

**⚠️ IMPORTANT FOR PRODUCTION**:

Direct database access from a mobile client is acceptable for MVP/development but **NOT recommended for production**.

**Why?**:
- Database credentials are exposed in the client app
- No rate limiting or request validation
- Potential for abuse or data breaches

**Production Strategy** (when you scale):
1. Create a backend API (Node.js/Express or Edge Functions)
2. Mobile app calls API endpoints
3. API validates requests and communicates with database
4. Database credentials stay secure on server

**When to migrate**:
- Before public launch
- When you have >1,000 active users
- When you receive funding
- When security audit required

---

## 🧪 Testing

After adding `EXPO_PUBLIC_DATABASE_URL` and restarting:

1. **Auth flow**: Sign up → Should save user profile ✅
2. **Onboarding**: Complete 10 steps → Should persist to database ✅
3. **AI Generator**: Generate workout → Should save workout ✅
4. **Workout Player**: Complete workout → Should track session ✅
5. **Profile**: Toggle settings → Should persist preferences ✅

All database operations will now work! 🎉

---

## 🆘 Troubleshooting

### Still seeing the error?

1. **Check `.env` file exists**: Make sure you have a `.env` file (not just `.env.example`)
2. **Verify the variable name**: Must be exactly `EXPO_PUBLIC_DATABASE_URL` (with underscore)
3. **Check the value**: Should start with `postgresql://`
4. **Restart server**: Stop and restart `npm start` after any .env changes
5. **Clear cache**: Run `npx expo start --clear`

### Database operations fail?

Check console for warnings:
```
⚠️ DATABASE_URL not configured. Database operations will fail.
For React Native, set EXPO_PUBLIC_DATABASE_URL in .env
```

If you see this, your `.env` is not properly configured.

---

## ✅ Checklist

- [ ] Created `.env` file (copy from `.env.example`)
- [ ] Added `EXPO_PUBLIC_DATABASE_URL` with your Neon PostgreSQL URL
- [ ] Kept existing `DATABASE_URL` (for Node.js scripts)
- [ ] Restarted development server (`npm start`)
- [ ] Tested auth flow (sign up/sign in)
- [ ] Tested database save (onboarding, AI generator, etc.)

---

**All set!** Your database is now properly configured for React Native. 🚀

**Questions?** Check the main `CLAUDE.md` or `.env.example` for more details.
