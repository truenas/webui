#!/usr/bin/env node
import fs from "fs";
import { exec } from "child_process";

const translationDir = "src/assets/i18n/";

function getFilePath(language) {
  return `${translationDir}${language}.json`;
}

// Loop through all the files in the temp directory
fs.readdir(translationDir, function (err, files) {
  if (err) {
    console.error("Could not list the directory.", err);
    process.exit(1);
  }

  const languages = [];

  files.forEach((file) => {
    if (!file.match(/\.json$/)) {
      return;
    }

    const language = file.replace(/\.json$/, '');
    languages.push(language);
  });

  const outputArgument = languages
    .map(getFilePath)
    .join(' ');

  exec('ngx-translate-extract --input src --output ' + outputArgument + ' --clean --string-as-default-value --fi "\t"', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      console.error("Error extracting strings.");
      // node couldn't execute the command
      process.exit(1);
    }
    console.log(stdout);
    console.error(stderr);

    // Reorder keys so that untranslated strings are on top.
    languages.forEach((language) => {
      const filePath = getFilePath(language);
      const messages = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }));
      const output = {};
      const nonTranslatedKeys = [];
      const translatedKeys = [];

      Object.keys(messages).forEach((key) => {
        if (messages[key] === '') {
          nonTranslatedKeys.push(key);
        } else {
          translatedKeys.push(key);
        }
      });

      nonTranslatedKeys.sort().forEach((key) => output[key] = messages[key]);
      translatedKeys.sort().forEach((key) => output[key] = messages[key]);

      const stream = fs.createWriteStream(filePath, {});
      stream.write(JSON.stringify(output, null, '  '));
    });
  });
});
