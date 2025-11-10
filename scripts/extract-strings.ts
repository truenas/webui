#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import { getLanguageFiles } from './language/get-language-files';

export const translationDir = 'src/assets/i18n/';

function getFilePath(language: string): string {
  return `${translationDir}${language}.json`;
}

function processLanguageFiles(languages: string[]): void {
  // Reorder keys so that untranslated strings are on top.
  languages.forEach((language) => {
    const filePath = getFilePath(language);
    try {
      const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
      let messages: Record<string, string> = {};

      // Handle empty or malformed JSON files
      if (fileContent.trim()) {
        try {
          messages = JSON.parse(fileContent) as Record<string, string>;
        } catch (parseError) {
          console.warn(`Warning: Could not parse ${filePath}, treating as empty:`, parseError);
          messages = {};
        }
      }

      const output: Record<string, string> = {};
      const nonTranslatedKeys: string[] = [];
      const translatedKeys: string[] = [];

      Object.keys(messages).forEach((key) => {
        if (messages[key] === '') {
          nonTranslatedKeys.push(key);
        } else {
          translatedKeys.push(key);
        }
      });

      nonTranslatedKeys.toSorted((a, b) => a.localeCompare(b)).forEach((key) => output[key] = messages[key]);
      translatedKeys.toSorted((a, b) => a.localeCompare(b)).forEach((key) => output[key] = messages[key]);

      const stream = fs.createWriteStream(filePath, {});
      stream.write(JSON.stringify(output, null, '  '));
      stream.end();
    } catch (fileError) {
      console.warn(`Warning: Could not process ${filePath}:`, fileError);
    }
  });
}

(async () => {
  try {
    const languages = await getLanguageFiles();
    const outputFiles = languages.map(getFilePath);

    // Use spawn to avoid command line length limits
    const args = [
      '--input', 'src',
      '--output', ...outputFiles,
      '--string-as-default-value',
      '--fi', '\t',
      '--clean',
    ];

    const child = spawn('./node_modules/.bin/ngx-translate-extract', args, { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`Error extracting strings. Process exited with code ${code}`);
        process.exit(1);
      }

      processLanguageFiles(languages);
    });

    child.on('error', (err) => {
      console.error('Error running ngx-translate-extract:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('Error fetching language files:', err);
    process.exit(1);
  }
})();
