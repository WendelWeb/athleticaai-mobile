# 🧪 AthleticaAI Tests

Comprehensive test suite for AthleticaAI Mobile application.

---

## 📋 Test Structure

```
__tests__/
├── utils/
│   └── dateHelpers.test.ts    # Date handling & timezone tests
└── README.md                   # This file
```

---

## 🚀 Running Tests

### Prerequisites

```bash
npm install --save-dev jest @types/jest ts-jest
```

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test dateHelpers
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Watch Mode (Development)

```bash
npm test -- --watch
```

---

## 📝 Test Categories

### 1. Date Helpers Tests (`utils/dateHelpers.test.ts`)

**Coverage:**
- ✅ `toISOString()` - Date to ISO string conversion
- ✅ `safeToISOString()` - Null-safe date conversion
- ✅ `formatDate()` - Human-readable date formatting
- ✅ Timezone consistency
- ✅ Database timestamp compatibility
- ✅ Date comparisons (`isToday`, `isWithinDays`)
- ✅ Edge cases & error handling
- ✅ Performance benchmarks

**Total Test Cases:** 40+

**Key Tests:**
```typescript
// Timezone consistency
test('toISOString always returns UTC timezone (Z suffix)')
test('handles DST transitions correctly')

// Database compatibility
test('toISOString output is compatible with PostgreSQL timestamptz')
test('roundtrip: Date → ISO → Date preserves timestamp')

// Edge cases
test('handles invalid Date objects')
test('handles dates outside valid range')
```

---

## 🌍 Timezone Testing

### Why Timezone Tests Matter

1. **Database Consistency:** PostgreSQL `timestamptz` expects UTC
2. **Cross-Platform:** Users in different timezones
3. **DST Transitions:** Daylight Saving Time changes
4. **Data Integrity:** Prevent date corruption

### Timezone Test Coverage

```typescript
// ✅ COVERED: UTC consistency
toISOString(new Date()) always ends with 'Z' (UTC)

// ✅ COVERED: PostgreSQL format compatibility
PostgreSQL date '2025-01-07' → '2025-01-07T00:00:00.000Z'

// ✅ COVERED: DST transitions
Dates before/after DST maintain correct timestamps

// ✅ COVERED: Roundtrip conversion
Date → ISO → Date preserves exact timestamp
```

---

## 🔧 Jest Configuration

Create `jest.config.js` in project root:

```javascript
module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
};
```

---

## 📊 Expected Test Results

### Passing Tests

```
PASS  __tests__/utils/dateHelpers.test.ts
  dateHelpers
    toISOString
      ✓ converts valid Date object to ISO string
      ✓ converts ISO string to ISO string (passthrough)
      ✓ converts PostgreSQL date format (YYYY-MM-DD) to ISO
      ✓ returns fallback for null/undefined
      ... (40+ more tests)

Tests:       40 passed, 40 total
Time:        2.5s
```

### Coverage Goals

| Category | Target | Status |
|----------|--------|--------|
| **Statements** | ≥80% | ✅ |
| **Branches** | ≥75% | ✅ |
| **Functions** | ≥85% | ✅ |
| **Lines** | ≥80% | ✅ |

---

## 🐛 Debugging Failed Tests

### Common Issues

**Issue:** `Cannot find module '@/utils/dateHelpers'`
```bash
# Fix: Ensure moduleNameMapper in jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

**Issue:** `ReferenceError: __DEV__ is not defined`
```bash
# Fix: Add to jest setup
global.__DEV__ = true;
```

**Issue:** Timezone-related failures
```bash
# Fix: Tests should always use UTC
process.env.TZ = 'UTC';
```

---

## 📈 Adding New Tests

### Test File Template

```typescript
import { myFunction } from '@/utils/myUtils';

describe('myUtils', () => {
  describe('myFunction', () => {
    test('handles valid input', () => {
      expect(myFunction('valid')).toBe('expected');
    });

    test('handles invalid input gracefully', () => {
      expect(myFunction(null)).toBe(null);
    });

    test('edge case: empty string', () => {
      expect(myFunction('')).toBe('fallback');
    });
  });
});
```

### Best Practices

1. **Descriptive names:** `test('converts valid Date to ISO string')`
2. **One assertion per test:** Focus on single behavior
3. **Cover edge cases:** null, undefined, invalid inputs
4. **Performance tests:** Ensure functions are fast
5. **Use beforeEach/afterEach:** Clean up state between tests

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [Testing Best Practices](https://testingjavascript.com/)

---

## ✅ Test Checklist

Before pushing code:

- [ ] All tests pass (`npm test`)
- [ ] Coverage ≥80% (`npm test -- --coverage`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Added tests for new features
- [ ] Edge cases covered
- [ ] Performance tests added (if applicable)

---

**🧪 Keep Testing, Keep Shipping!**
