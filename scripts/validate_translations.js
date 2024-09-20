import fs from "fs";
import {parse} from "messageformat-parser";

const translationDir = "src/assets/i18n/";

// Loop through all the files in the temp directory
fs.readdir(translationDir, function (err, files) {
  if (err) {
    console.error("Could not list the directory.", err);
    process.exit(1);
  }

  let hadErrors = false;

  files.forEach(function (file) {
    if (!file.match(/\.json$/)) {
      return;
    }

    const language = file.replace(/\.json$/, '');
    const messages = JSON.parse(fs.readFileSync(translationDir + file, { encoding: 'utf-8' }));

    // Validate line by line because it gives better error messages
    let line = 2; // First line is opening bracket
    Object.entries(messages).forEach(([key, translation]) => {
      try {
        parse(key);
        parse(translation);
        line++;
      } catch (error) {
        hadErrors = true;

        console.error(`${language}.json, line ${line}: ${error.message}`);
      }
    });
  });

  if (hadErrors) {
    process.exit(1);
  }
});
