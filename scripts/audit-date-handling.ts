/**
 * 🔍 DATE HANDLING AUDIT SCRIPT
 *
 * Audits all date handling in codebase to identify:
 * - new Date() usages that should use toISOString()
 * - Direct .toISOString() calls without safety checks
 * - Unsafe timestamp assignments
 * - Root cause of date errors
 *
 * Run with: npx tsx scripts/audit-date-handling.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface DateUsage {
  file: string;
  line: number;
  code: string;
  issue: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
}

const issues: DateUsage[] = [];

/**
 * Read file and find date-related issues
 */
function auditFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const fileName = path.relative(process.cwd(), filePath);

    // Skip if it's a documentation, markdown, or test file
    if (
      fileName.includes('.md') ||
      fileName.includes('node_modules') ||
      fileName.includes('scripts/audit-date-handling.ts') ||
      fileName.includes('dateHelpers.ts') // Skip the helper itself
    ) {
      return;
    }

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // CRITICAL: Database timestamp assignments with new Date()
      // BUT: Ignore if already using .toISOString() (e.g., "new Date().toISOString()")
      if (
        /(?:started_at|completed_at|scheduled_at|created_at|updated_at|last_login):\s*new Date\(\)/.test(
          line
        ) &&
        !line.includes('new Date().toISOString()')
      ) {
        // Also check if this is in a TypeScript file with typed objects (optimistic UI updates)
        // These are often correct when the type is Date (not string)
        const isOptimisticUpdate = line.includes('optimistic') || trimmed.includes('const ') || trimmed.includes('=');

        issues.push({
          file: fileName,
          line: lineNum,
          code: trimmed,
          issue: isOptimisticUpdate
            ? 'Database timestamp using new Date() (verify type expects Date not string)'
            : 'Database timestamp using new Date() instead of ISO string',
          severity: isOptimisticUpdate ? 'MEDIUM' : 'HIGH',
          category: 'Database Timestamps',
        });
      }

      // HIGH: Direct .toISOString() without null check
      if (/(?<!safe)(?<!\.)toISOString\(\)/.test(line) && !line.includes('new Date()')) {
        // Check if it's not already wrapped in safeToISOString or toISOString helper
        if (!line.includes('safeToISOString') && !line.includes('dateHelpers')) {
          issues.push({
            file: fileName,
            line: lineNum,
            code: trimmed,
            issue: 'Direct .toISOString() without null safety check',
            severity: 'MEDIUM',
            category: 'Unsafe toISOString',
          });
        }
      }

      // MEDIUM: new Date() with comparisons (timezone issues)
      if (/new Date\(\).*[<>]=?/.test(line) || /[<>]=?.*new Date\(\)/.test(line)) {
        issues.push({
          file: fileName,
          line: lineNum,
          code: trimmed,
          issue: 'Date comparison using new Date() (potential timezone issues)',
          severity: 'MEDIUM',
          category: 'Date Comparisons',
        });
      }

      // LOW: new Date(string) without validation
      if (/new Date\(['"`][^'"`]+['"`]\)/.test(line) && !line.includes('safeToISOString')) {
        issues.push({
          file: fileName,
          line: lineNum,
          code: trimmed,
          issue: 'new Date(string) without validation (potential invalid date)',
          severity: 'LOW',
          category: 'Date Parsing',
        });
      }
    });
  } catch (error) {
    // Silently skip files that can't be read
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .git, build folders
      if (!['node_modules', '.git', '.expo', 'dist', 'build'].includes(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      // Only scan TypeScript/JavaScript files
      if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        auditFile(fullPath);
      }
    }
  }
}

/**
 * Print audit results
 */
function printResults() {
  console.log('\n🔍 DATE HANDLING AUDIT RESULTS\n');
  console.log('='.repeat(100));

  if (issues.length === 0) {
    console.log('\n✅ No date handling issues found!\n');
    return;
  }

  // Group by severity
  const high = issues.filter((i) => i.severity === 'HIGH');
  const medium = issues.filter((i) => i.severity === 'MEDIUM');
  const low = issues.filter((i) => i.severity === 'LOW');

  // Print HIGH severity issues
  if (high.length > 0) {
    console.log('\n🔴 HIGH SEVERITY ISSUES (Database Timestamps)\n');
    high.forEach((issue) => {
      console.log(`  📍 ${issue.file}:${issue.line}`);
      console.log(`     ${issue.issue}`);
      console.log(`     Code: ${issue.code}`);
      console.log('');
    });
  }

  // Print MEDIUM severity issues
  if (medium.length > 0) {
    console.log('\n🟡 MEDIUM SEVERITY ISSUES\n');

    // Group medium by category
    const categories = [...new Set(medium.map((i) => i.category))];
    categories.forEach((category) => {
      const categoryIssues = medium.filter((i) => i.category === category);
      console.log(`\n  ${category} (${categoryIssues.length} issues):\n`);

      categoryIssues.slice(0, 10).forEach((issue) => {
        console.log(`    📍 ${issue.file}:${issue.line}`);
        console.log(`       ${issue.issue}`);
        console.log(`       Code: ${issue.code.substring(0, 80)}...`);
        console.log('');
      });

      if (categoryIssues.length > 10) {
        console.log(`    ... and ${categoryIssues.length - 10} more\n`);
      }
    });
  }

  // Print LOW severity issues (summary only)
  if (low.length > 0) {
    console.log(`\n🟢 LOW SEVERITY ISSUES: ${low.length} issues`);
    console.log('   (new Date(string) without validation - potential invalid dates)\n');
  }

  // Summary
  console.log('='.repeat(100));
  console.log(`\n📊 SUMMARY:\n`);
  console.log(`  🔴 HIGH:   ${high.length} issues (CRITICAL - Database timestamps)`);
  console.log(`  🟡 MEDIUM: ${medium.length} issues (Date comparisons, unsafe toISOString)`);
  console.log(`  🟢 LOW:    ${low.length} issues (Date parsing validation)`);
  console.log(`  📈 TOTAL:  ${issues.length} issues\n`);

  // Root cause analysis
  console.log('='.repeat(100));
  console.log('\n🔬 ROOT CAUSE ANALYSIS:\n');

  if (high.length > 0) {
    console.log('  ❌ IDENTIFIED: Database timestamp fields receiving Date objects');
    console.log('     - Neon PostgreSQL expects ISO strings (timestamptz)');
    console.log('     - Drizzle ORM may not convert Date objects correctly');
    console.log('     - Solution: Use toISOString(new Date()) for all timestamp fields\n');
  }

  if (medium.length > 0) {
    console.log('  ⚠️  RISK: Direct .toISOString() calls without null safety');
    console.log('     - Can throw "Cannot read property of undefined"');
    console.log('     - Solution: Use safeToISOString() from dateHelpers\n');
  }

  if (low.length > 0) {
    console.log('  ⚡ INFO: Date parsing from strings without validation');
    console.log('     - Can create Invalid Date objects');
    console.log('     - Solution: Use toISOString(value, null) for validation\n');
  }

  console.log('='.repeat(100));
  console.log('\n🔧 RECOMMENDED FIXES:\n');
  console.log('  1. Replace all database timestamp assignments:');
  console.log('     ❌ started_at: new Date()');
  console.log('     ✅ started_at: toISOString(new Date())');
  console.log('');
  console.log('  2. Use safeToISOString for optional date fields:');
  console.log('     ❌ completed_at: someDate.toISOString()');
  console.log('     ✅ completed_at: safeToISOString(someDate)');
  console.log('');
  console.log('  3. Import from @/utils/dateHelpers:');
  console.log('     import { toISOString, safeToISOString } from "@/utils/dateHelpers";');
  console.log('');
  console.log('='.repeat(100));
  console.log('');

  process.exit(issues.length > 0 ? 1 : 0);
}

/**
 * Main
 */
function main() {
  console.log('🚀 DATE HANDLING AUDIT\n');
  console.log('Scanning codebase for date-related issues...\n');

  // Scan critical directories
  const dirsToScan = ['src', 'app'];

  dirsToScan.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 Scanning ${dir}/...`);
      scanDirectory(fullPath);
    }
  });

  console.log(`\n✅ Scanned ${issues.length} potential issues\n`);

  printResults();
}

main();
