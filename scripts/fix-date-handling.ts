/**
 * 🔧 DATE HANDLING FIX SCRIPT
 *
 * Automatically fixes all date handling issues:
 * - Replace `field: new Date()` with `field: toISOString(new Date())`
 * - Add toISOString import where needed
 *
 * Run with: npx tsx scripts/fix-date-handling.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface Fix {
  file: string;
  before: string;
  after: string;
}

const fixes: Fix[] = [];

/**
 * Fix date handling in a file
 */
function fixFile(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let modified = content;
    let hasChanges = false;

    // Pattern 1: field_name: new Date() → field_name: toISOString(new Date())
    const timestampFields = [
      'started_at',
      'completed_at',
      'scheduled_at',
      'created_at',
      'updated_at',
      'last_login',
      'last_updated_at',
      'onboarding_completed_at',
    ];

    timestampFields.forEach((field) => {
      // Match: field: new Date() or field: new Date().toISOString()
      const pattern1 = new RegExp(`(${field}):\\s*new Date\\(\\)(?!\\.toISOString)`, 'g');
      const pattern2 = new RegExp(`(${field}):\\s*new Date\\(\\)\\.toISOString\\(\\)`, 'g');

      if (pattern1.test(modified)) {
        modified = modified.replace(pattern1, `$1: toISOString(new Date())`);
        hasChanges = true;
      }

      if (pattern2.test(modified)) {
        modified = modified.replace(pattern2, `$1: toISOString(new Date())`);
        hasChanges = true;
      }
    });

    // If changes were made, ensure toISOString is imported
    if (hasChanges) {
      // Check if toISOString is already imported
      const hasToISOStringImport =
        /import.*toISOString.*from.*@\/utils/.test(modified) ||
        /import.*from ['"]@\/utils\/dateHelpers['"]/.test(modified);

      if (!hasToISOStringImport) {
        // Check if there's already an import from @/utils
        const utilsImportMatch = modified.match(/import\s*{([^}]*)}\s*from\s*['"]@\/utils['"]/);

        if (utilsImportMatch) {
          // Add toISOString to existing @/utils import
          const imports = utilsImportMatch[1];
          if (!imports.includes('toISOString')) {
            const newImports = imports.trim() ? `${imports.trim()}, toISOString` : 'toISOString';
            modified = modified.replace(
              /import\s*{([^}]*)}\s*from\s*['"]@\/utils['"]/,
              `import { ${newImports} } from '@/utils'`
            );
          }
        } else {
          // Add new import from @/utils
          // Find the last import statement
          const lines = modified.split('\n');
          let lastImportIndex = -1;

          for (let i = 0; i < lines.length; i++) {
            if (/^import\s/.test(lines[i].trim())) {
              lastImportIndex = i;
            }
          }

          if (lastImportIndex !== -1) {
            lines.splice(lastImportIndex + 1, 0, "import { toISOString } from '@/utils';");
            modified = lines.join('\n');
          }
        }
      }

      fs.writeFileSync(filePath, modified, 'utf-8');

      fixes.push({
        file: path.relative(process.cwd(), filePath),
        before: content,
        after: modified,
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
    return false;
  }
}

/**
 * Recursively scan and fix directory
 */
function scanAndFix(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .git, build folders
      if (!['node_modules', '.git', '.expo', 'dist', 'build', 'scripts'].includes(entry.name)) {
        scanAndFix(fullPath);
      }
    } else if (entry.isFile()) {
      // Only process TypeScript files
      if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.includes('fix-date-handling')) {
        fixFile(fullPath);
      }
    }
  }
}

/**
 * Main
 */
function main() {
  console.log('🔧 DATE HANDLING FIX\n');
  console.log('Automatically fixing all date handling issues...\n');

  // Fix critical directories
  const dirsToFix = ['src', 'app'];

  dirsToFix.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 Fixing ${dir}/...`);
      scanAndFix(fullPath);
    }
  });

  console.log(`\n✅ Fixed ${fixes.length} files\n`);

  if (fixes.length > 0) {
    console.log('📝 Files modified:\n');
    fixes.forEach((fix) => {
      console.log(`  ✅ ${fix.file}`);
    });
  }

  console.log('\n🎉 Date handling fix complete!\n');
  console.log('Next steps:');
  console.log('  1. Run: npm run typecheck');
  console.log('  2. Run: npx tsx scripts/audit-date-handling.ts');
  console.log('  3. Test critical flows (workout sessions, profile updates)\n');
}

main();
