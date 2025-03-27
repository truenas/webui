#!/usr/bin/env node
import { exec } from 'child_process';
import fs from 'fs';
import { getLanguageFiles } from 'app/helpers/language.helper';

export const translationDir = 'src/assets/i18n/';

function getFilePath(language: string): string {
  return `${translationDir}${language}.json`;
}

async function extractNewStrings(): Promise<void> {
  try {
    const languages = await getLanguageFiles();
    const outputArgument = languages
      .map(getFilePath)
      .join(' ');

    exec('ngx-translate-extract --input src --output ' + outputArgument + ' --clean --string-as-default-value --fi "\t"', (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        console.error('Error extracting strings.');
        // node couldn't execute the command
        process.exit(1);
      }
      console.info(stdout);
      console.error(stderr);

      // Reorder keys so that untranslated strings are on top.
      languages.forEach((language) => {
        const filePath = getFilePath(language);
        const messages = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' })) as Record<string, string>;
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
      });
    });
  } catch (err) {
    console.error('Error fetching language files:', err);
    process.exit(1);
  }
}

extractNewStrings();
