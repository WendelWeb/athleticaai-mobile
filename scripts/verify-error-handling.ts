/**
 * 🔍 ERROR HANDLING VERIFICATION SCRIPT
 *
 * Verifies error handling implementation through code analysis
 * Run with: npx tsx scripts/verify-error-handling.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  category: string;
  check: string;
  passed: boolean;
  details?: string;
}

const results: VerificationResult[] = [];

/**
 * Helper: Check if file contains pattern
 */
function fileContains(filePath: string, pattern: string | RegExp): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (typeof pattern === 'string') {
      return content.includes(pattern);
    }
    return pattern.test(content);
  } catch (error) {
    return false;
  }
}

/**
 * Helper: Count occurrences in file
 */
function countInFile(filePath: string, pattern: RegExp): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * VERIFICATION 1: ErrorState Component
 */
function verifyErrorStateComponent() {
  console.log('\n🔍 VERIFICATION 1: ErrorState Component\n');

  const componentPath = path.join(process.cwd(), 'src/components/ui/ErrorState.tsx');

  // Check 1.1: Component file exists
  results.push({
    category: 'ErrorState Component',
    check: 'Component file exists',
    passed: fs.existsSync(componentPath),
  });

  // Check 1.2: Has error type detection
  results.push({
    category: 'ErrorState Component',
    check: 'Has network error detection',
    passed: fileContains(componentPath, 'network') && fileContains(componentPath, 'connection'),
  });

  // Check 1.3: Has auth error detection
  results.push({
    category: 'ErrorState Component',
    check: 'Has auth error detection',
    passed: fileContains(componentPath, 'auth') || fileContains(componentPath, 'unauthorized'),
  });

  // Check 1.4: Has retry functionality
  results.push({
    category: 'ErrorState Component',
    check: 'Has retry button with onRetry prop',
    passed: fileContains(componentPath, 'onRetry') && fileContains(componentPath, 'Retry'),
  });

  // Check 1.5: Has haptic feedback
  results.push({
    category: 'ErrorState Component',
    check: 'Has haptic feedback on retry',
    passed: fileContains(componentPath, 'Haptics'),
  });

  // Check 1.6: Has animations
  results.push({
    category: 'ErrorState Component',
    check: 'Has FadeInDown animation',
    passed: fileContains(componentPath, 'FadeInDown'),
  });

  // Check 1.7: Has compact mode
  results.push({
    category: 'ErrorState Component',
    check: 'Supports compact mode',
    passed: fileContains(componentPath, 'compact'),
  });
}

/**
 * VERIFICATION 2: Service Error Throwing
 */
function verifyServiceErrorThrowing() {
  console.log('\n🔍 VERIFICATION 2: Service Error Throwing\n');

  const servicesToCheck = [
    'src/services/drizzle/workouts.ts',
    'src/services/drizzle/user-programs.ts',
    'src/services/drizzle/stats.ts',
    'src/services/drizzle/achievements.ts',
    'src/services/drizzle/profile.ts',
  ];

  servicesToCheck.forEach((servicePath) => {
    const fullPath = path.join(process.cwd(), servicePath);
    const fileName = path.basename(servicePath);

    // Check: Has throw error after handleError
    const throwCount = countInFile(fullPath, /throw error;/g);
    const showToastCount = countInFile(fullPath, /showToast:\s*true/g);

    results.push({
      category: 'Service Error Throwing',
      check: `${fileName} throws errors after handleError`,
      passed: throwCount > 0,
      details: `Found ${throwCount} throw statements`,
    });

    // Check: Services use handleError
    results.push({
      category: 'Service Error Throwing',
      check: `${fileName} uses handleError for user-facing errors`,
      passed: showToastCount > 0,
      details: `Found ${showToastCount} user-facing error handlers`,
    });
  });
}

/**
 * VERIFICATION 3: Hook Error Propagation
 */
function verifyHookErrorPropagation() {
  console.log('\n🔍 VERIFICATION 3: Hook Error Propagation\n');

  const hooksToCheck = [
    { path: 'src/hooks/useWorkoutOfDay.ts', name: 'useWorkoutOfDay' },
    { path: 'src/hooks/useCurrentProgram.ts', name: 'useCurrentProgram' },
    { path: 'src/hooks/useUserStats.ts', name: 'useUserStats' },
    { path: 'src/hooks/useClerkAuth.ts', name: 'useClerkAuth' },
  ];

  hooksToCheck.forEach(({ path: hookPath, name }) => {
    const fullPath = path.join(process.cwd(), hookPath);

    // For React Query hooks, verify no catch blocks with return null
    if (name === 'useWorkoutOfDay' || name === 'useCurrentProgram') {
      const hasCatchWithReturnNull = fileContains(fullPath, /catch.*return null/s);

      results.push({
        category: 'Hook Error Propagation',
        check: `${name} doesn't catch and return null (React Query)`,
        passed: !hasCatchWithReturnNull,
        details: hasCatchWithReturnNull ? 'Found catch with return null' : 'Errors propagate to React Query',
      });
    }

    // For manual state hooks, verify they throw errors
    if (name === 'useUserStats' || name === 'useClerkAuth') {
      const hasThrowErr = fileContains(fullPath, 'throw err');

      results.push({
        category: 'Hook Error Propagation',
        check: `${name} throws errors after setting state`,
        passed: hasThrowErr,
        details: hasThrowErr ? 'Errors thrown for error boundaries' : 'No throw found',
      });
    }
  });
}

/**
 * VERIFICATION 4: UI Error State Integration
 */
function verifyUIErrorStates() {
  console.log('\n🔍 VERIFICATION 4: UI Error State Integration\n');

  const screensToCheck = [
    { path: 'app/(tabs)/index.tsx', name: 'Home Screen' },
    { path: 'app/(tabs)/progress.tsx', name: 'Progress Screen' },
    { path: 'app/(tabs)/profile.tsx', name: 'Profile Screen' },
    { path: 'app/achievements.tsx', name: 'Achievements Screen' },
    { path: 'app/workout-player/[id].tsx', name: 'Workout Player' },
  ];

  screensToCheck.forEach(({ path: screenPath, name }) => {
    const fullPath = path.join(process.cwd(), screenPath);

    // Check 1: Imports ErrorState
    const importsErrorState = fileContains(fullPath, "import { ErrorState }") ||
                               fileContains(fullPath, "import {ErrorState}");

    results.push({
      category: 'UI Error States',
      check: `${name} imports ErrorState`,
      passed: importsErrorState,
    });

    // Check 2: Uses ErrorState component
    const usesErrorState = fileContains(fullPath, '<ErrorState');

    results.push({
      category: 'UI Error States',
      check: `${name} renders ErrorState`,
      passed: usesErrorState,
    });

    // Check 3: Destructures error from hooks
    const destructuresError = fileContains(fullPath, /error[,:\s]/);

    results.push({
      category: 'UI Error States',
      check: `${name} destructures error from hooks`,
      passed: destructuresError,
    });

    // Check 4: Has onRetry callback
    const hasOnRetry = fileContains(fullPath, 'onRetry');

    results.push({
      category: 'UI Error States',
      check: `${name} provides onRetry callback`,
      passed: hasOnRetry,
    });
  });
}

/**
 * VERIFICATION 5: TypeScript Correctness
 */
async function verifyTypeScript() {
  console.log('\n🔍 VERIFICATION 5: TypeScript Correctness\n');

  try {
    const { execSync } = await import('child_process');
    execSync('npm run typecheck', { stdio: 'pipe' });

    results.push({
      category: 'TypeScript',
      check: 'TypeScript compiles without errors',
      passed: true,
      details: '0 errors',
    });
  } catch (error: any) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorCount = (output.match(/error TS/g) || []).length;

    results.push({
      category: 'TypeScript',
      check: 'TypeScript compiles without errors',
      passed: false,
      details: `${errorCount} TypeScript errors found`,
    });
  }
}

/**
 * Print Results
 */
function printResults() {
  console.log('\n📊 VERIFICATION RESULTS\n');
  console.log('='.repeat(100));

  const categories = [...new Set(results.map(r => r.category))];

  categories.forEach(category => {
    console.log(`\n${category}:`);
    const categoryResults = results.filter(r => r.category === category);

    categoryResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`  ${icon} ${result.check}`);
      if (result.details) {
        console.log(`     ${result.details}`);
      }
    });
  });

  console.log('\n' + '='.repeat(100));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`\n📈 Summary: ${passed}/${total} checks passed (${percentage}%)\n`);

  if (failed > 0) {
    console.log(`❌ ${failed} checks failed. Review the details above.\n`);
    process.exit(1);
  } else {
    console.log('✅ All verification checks passed!\n');
    process.exit(0);
  }
}

/**
 * Main
 */
async function main() {
  console.log('🚀 ERROR HANDLING VERIFICATION\n');
  console.log('Analyzing code for error handling implementation...\n');

  try {
    verifyErrorStateComponent();
    verifyServiceErrorThrowing();
    verifyHookErrorPropagation();
    verifyUIErrorStates();
    await verifyTypeScript();

    printResults();
  } catch (error) {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  }
}

main();
