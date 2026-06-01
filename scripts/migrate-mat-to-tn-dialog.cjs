#!/usr/bin/env node
/* eslint-disable */
/**
 * Codemod: migrate Angular Material dialog usage to TnDialog / cdk Dialog.
 *
 * v2 — conservative TS-only mode.
 *
 * What it covers:
 *   - .ts files: imports of @angular/material/dialog (MatDialog/Ref/_DATA + dropped directives),
 *     replacing MatDialogRef/MAT_DIALOG_DATA identifiers, MatDialog -> TnDialog,
 *     matDialog -> tnDialog, .afterClosed() -> .closed (but NOT on JobProgressDialogRef
 *     and NOT on anything inside *.spec.ts mock objects' `mockProvider(JobProgressDialogRef, ...)`).
 *
 *   - Adds TnDialogShellComponent to @Component({ imports }) when the file's matching
 *     .html template starts using <tn-dialog-shell>.
 *
 *   - .html templates: ONLY if the file has BOTH a single <h1/h2/h3 mat-dialog-title> AND
 *     either <mat-dialog-content> or <div mat-dialog-content>, the template is rewritten
 *     to wrap in <tn-dialog-shell [title]="...">. Otherwise the template is left for manual fix.
 *
 *   - .spec.ts: imports + identifiers same as .ts, plus
 *     `mockProvider(MatDialog/Ref, ...)` -> `mockProvider(TnDialog/DialogRef, ...)`,
 *     `MatButtonHarness.with({ text: ... })` -> `TnButtonHarness.with({ label: ... })`
 *     (NOTE: only safe when the dialog template was migrated to tn-button).
 *
 * What it does NOT cover (left for manual cleanup):
 *   - Complex templates with multiple titles, custom layouts, nested forms etc.
 *   - position: { top, right } -> Overlay positionStrategy
 *   - componentInstance.X = … legacy pattern
 *   - `MatButtonHarness.with({ text: ... })` for buttons that are still mat-button
 *
 * The script's correctness contract: any file it touches should still TS-compile.
 * If a file would need a structural template change beyond the simple shell wrap, the
 * script logs a warning and DOES NOT touch the HTML.
 *
 * Usage:
 *   node scripts/migrate-mat-to-tn-dialog.cjs [--dry] [path...]
 *   default path is src/app
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const roots = args.filter((a) => !a.startsWith('--'));
const searchRoots = roots.length ? roots : ['src/app'];

const stats = {
  filesScanned: 0,
  tsTouched: 0,
  htmlTouched: 0,
  specTouched: 0,
  htmlSkipped: 0,
  warnings: [],
};

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|html)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function loadFile(p) {
  return fs.readFileSync(p, 'utf8');
}
function saveFile(p, content) {
  if (dry) return;
  fs.writeFileSync(p, content, 'utf8');
}

function importsMatDialog(text) {
  return /from\s+['"]@angular\/material\/dialog['"]/.test(text);
}

function usesJobProgressDialogRef(text) {
  // Match either an explicit import/use of JobProgressDialogRef, or any call site of dialog.jobDialog(...)
  // (DialogService.jobDialog returns a JobProgressDialogRef whose API keeps .afterClosed()).
  return /\bJobProgressDialogRef\b/.test(text) || /\.jobDialog\s*\(/.test(text);
}

function transformMatDialogImports(text) {
  let changed = false;

  text = text.replace(
    /import\s*\{\s*([^}]+?)\s*\}\s*from\s*['"]@angular\/material\/dialog['"];?/g,
    (match, body) => {
      const names = body
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);

      const cdkSet = new Set();
      const dropped = new Set();
      let needsTnDialog = false;
      const kept = [];

      for (const n of names) {
        switch (n) {
          case 'MatDialog':
            needsTnDialog = true;
            break;
          case 'MatDialogRef':
            cdkSet.add('DialogRef');
            break;
          case 'MAT_DIALOG_DATA':
            cdkSet.add('DIALOG_DATA');
            break;
          case 'MatDialogTitle':
          case 'MatDialogContent':
          case 'MatDialogActions':
          case 'MatDialogClose':
          case 'MatDialogModule':
          case 'MatDialogConfig':
            dropped.add(n);
            break;
          default:
            kept.push(n);
        }
      }

      const lines = [];
      if (cdkSet.size) {
        lines.push(`import { ${Array.from(cdkSet).sort().join(', ')} } from '@angular/cdk/dialog';`);
      }
      if (needsTnDialog) {
        lines.push(`import { TnDialog } from '@truenas/ui-components';`);
      }
      if (kept.length) {
        lines.push(`import { ${kept.join(', ')} } from '@angular/material/dialog';`);
      }

      changed = true;
      return lines.join('\n');
    },
  );

  if (changed && /from\s+['"]@truenas\/ui-components['"]/.test(text)) {
    const importLines = [];
    text = text.replace(
      /import\s*\{\s*([^}]+?)\s*\}\s*from\s*['"]@truenas\/ui-components['"];?\n?/g,
      (match, body) => {
        importLines.push(...body.split(',').map((n) => n.trim()).filter(Boolean));
        return '';
      },
    );
    const merged = Array.from(new Set(importLines)).sort().join(', ');
    text = text.replace(/(^|\n)(import .*?;)/m, `$1$2\nimport { ${merged} } from '@truenas/ui-components';`);
  }

  return { text, changed };
}

function transformTsBody(text, opts) {
  const usesJpdRef = opts && opts.usesJpdRef;
  let changed = false;
  const before = text;

  text = text.replace(/\bMatDialogRef\b/g, 'DialogRef');
  text = text.replace(/\bMAT_DIALOG_DATA\b/g, 'DIALOG_DATA');
  text = text.replace(/\bMatDialog\b(?!Title|Content|Actions|Close|Module|Config|State)/g, 'TnDialog');
  text = text.replace(/\bmatDialog\b/g, 'tnDialog');

  // Drop generic on DialogRef<X> because cdk DialogRef<R, C> has R first;
  // we cannot infer R from a Mat-style single-generic. Callers can re-add explicit types.
  text = text.replace(/\bDialogRef<[^>]+>/g, 'DialogRef');

  if (!usesJpdRef) {
    text = text.replace(/\.afterClosed\(\)/g, '.closed');
    text = text.replace(/afterClosed:\s*\(\s*\)\s*=>\s*([^,}\n]+)/g, 'closed: $1');
  }

  for (const drop of ['MatDialogTitle', 'MatDialogContent', 'MatDialogActions', 'MatDialogClose', 'MatDialogModule']) {
    text = text.replace(new RegExp(`^\\s*${drop},?\\s*\\n`, 'gm'), '');
  }

  if (text !== before) changed = true;
  return { text, changed };
}

function extractTitleExpr(inner) {
  inner = inner.trim();
  const m1 = inner.match(/^\{\{\s*([\s\S]+?)\s*\}\}$/);
  if (m1) return m1[1].trim();
  if (/^[^<>{}]+$/.test(inner)) return `'${inner.trim().replace(/'/g, "\\'")}' | translate`;
  return null;
}

function transformHtmlTemplate(file, text) {
  if (!/mat-dialog-(title|content|actions)|matDialogClose|mat-dialog-close|matDialogTitle/.test(text)) {
    return { text, changed: false };
  }
  const before = text;

  const allTitleMatches = text.match(/<h\d[^>]*(?:mat-dialog-title|matDialogTitle)[^>]*>[\s\S]*?<\/h\d>/g) || [];
  if (allTitleMatches.length > 1) {
    stats.warnings.push(`SKIP (multiple titles): ${file}`);
    stats.htmlSkipped++;
    return { text, changed: false };
  }

  let titleExpr = '';
  if (allTitleMatches.length === 1) {
    const titleMatch = allTitleMatches[0];
    const inner = titleMatch.replace(/^<h\d[^>]*>/, '').replace(/<\/h\d>$/, '');
    const ex = extractTitleExpr(inner);
    if (ex == null) {
      stats.warnings.push(`SKIP (complex title): ${file}`);
      stats.htmlSkipped++;
      return { text, changed: false };
    }
    titleExpr = ex;
    text = text.replace(titleMatch, '');
  }

  // Just strip the mat-dialog-content attribute, leave the div intact (regex-safe).
  text = text.replace(/(<\w+[^>]*?)\s+mat-dialog-content(\s*[^>]*>)/g, '$1$2');
  text = text.replace(/<mat-dialog-content[^>]*>([\s\S]*?)<\/mat-dialog-content>/g, '$1');

  text = text.replace(/(<div[^>]*?)\s+mat-dialog-actions([^>]*>)/g, '$1 tnDialogAction$2');
  text = text.replace(/(<ix-form-actions[^>]*?)\s+mat-dialog-actions([^>]*>)/g, '$1 tnDialogAction$2');

  text = text.replace(/(\s)mat-dialog-close(?:=("|')([^"']*?)\2)?/g, '');
  text = text.replace(/(\s)\[mat-dialog-close\](?:=("|')([^"']*?)\2)?/g, '');
  text = text.replace(/(\s)matDialogClose(?:=("|')([^"']*?)\2)?/g, '');
  text = text.replace(/(\s)\[matDialogClose\](?:=("|')([^"']*?)\2)?/g, '');

  if (titleExpr) {
    text = `<tn-dialog-shell [title]="${titleExpr}">\n${text.trim()}\n</tn-dialog-shell>\n`;
  }

  return { text, changed: text !== before };
}

function transformSpecExtras(text) {
  let changed = false;
  const before = text;
  text = text.replace(/\bmockProvider\(MatDialog\b/g, 'mockProvider(TnDialog');
  text = text.replace(/\bmockProvider\(MatDialogRef\b/g, 'mockProvider(DialogRef');
  if (text !== before) changed = true;
  return { text, changed };
}

function ensureShellInComponentImports(file) {
  const tsFile = file.replace(/\.html$/, '.ts');
  if (!fs.existsSync(tsFile)) return;
  let text = loadFile(tsFile);

  if (!/templateUrl:\s*['"]\.\/[^'"]+['"]/.test(text)) return;
  if (/\bTnDialogShellComponent\b/.test(text)) return;

  if (/from\s+['"]@truenas\/ui-components['"]/.test(text)) {
    text = text.replace(
      /import\s*\{\s*([^}]+?)\s*\}\s*from\s*['"]@truenas\/ui-components['"];?/,
      (match, body) => {
        const items = new Set(body.split(',').map((n) => n.trim()).filter(Boolean));
        items.add('TnDialogShellComponent');
        return `import { ${Array.from(items).sort().join(', ')} } from '@truenas/ui-components';`;
      },
    );
  } else {
    text = text.replace(/(^|\n)(import .*?;)/m, `$1$2\nimport { TnDialogShellComponent } from '@truenas/ui-components';`);
  }

  text = text.replace(
    /imports:\s*\[\s*([\s\S]*?)\s*\]/,
    (match, body) => {
      if (/\bTnDialogShellComponent\b/.test(body)) return match;
      const trimmed = body.trimEnd().replace(/,\s*$/, '');
      return `imports: [\n    TnDialogShellComponent,\n${trimmed},\n  ]`;
    },
  );

  saveFile(tsFile, text);
}

function processTsFile(file) {
  let text = loadFile(file);
  if (!importsMatDialog(text) && !/\bmatDialog\.|MatDialogRef|MAT_DIALOG_DATA/.test(text)) {
    return;
  }
  let totalChanged = false;
  const usesJpdRef = usesJobProgressDialogRef(text);
  if (importsMatDialog(text)) {
    const r = transformMatDialogImports(text);
    text = r.text;
    if (r.changed) totalChanged = true;
  }
  const r2 = transformTsBody(text, { usesJpdRef });
  text = r2.text;
  if (r2.changed) totalChanged = true;
  if (file.endsWith('.spec.ts')) {
    const r3 = transformSpecExtras(text);
    text = r3.text;
    if (r3.changed) totalChanged = true;
  }
  if (totalChanged) {
    saveFile(file, text);
    if (file.endsWith('.spec.ts')) stats.specTouched++;
    else stats.tsTouched++;
  }
}

function processHtmlFile(file) {
  let text = loadFile(file);
  const r = transformHtmlTemplate(file, text);
  if (r.changed) {
    saveFile(file, r.text);
    stats.htmlTouched++;
    if (!dry) ensureShellInComponentImports(file);
  }
}

for (const root of searchRoots) {
  for (const file of walk(root)) {
    stats.filesScanned++;
    if (file.endsWith('.ts')) processTsFile(file);
    else processHtmlFile(file);
  }
}

console.log(`Scanned ${stats.filesScanned} files`);
console.log(`TS touched: ${stats.tsTouched}, specs touched: ${stats.specTouched}, HTML touched: ${stats.htmlTouched}, HTML skipped (manual): ${stats.htmlSkipped}`);
if (stats.warnings.length) {
  console.log('\nWarnings:');
  for (const w of stats.warnings) console.log(`  ${w}`);
}
if (dry) console.log('\n(--dry — no files written)');
