import fs from "fs";
import {parse} from "messageformat-parser";

// Optional argument points the check at another directory, e.g. a folder of test fixtures.
const translationDir = (process.argv[2] || "src/assets/i18n").replace(/\/?$/, "/");

// Collects the variable names a message reads, including those nested in plural/select cases.
function collectArguments(tokens, names = new Set()) {
  tokens.forEach((token) => {
    if (typeof token !== 'object' || !token.arg) {
      return;
    }

    names.add(token.arg);
    (token.cases || []).forEach((messageCase) => collectArguments(messageCase.tokens, names));
  });
  return names;
}

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
    let line = 1; // First line is opening bracket
    Object.entries(messages).forEach(([key, translation]) => {
      line++;
      try {
        const keyArguments = collectArguments(parse(key));
        // A translated or renamed variable is never passed by the code, so it renders empty.
        const unknownArguments = [...collectArguments(parse(translation))]
          .filter((name) => !keyArguments.has(name));
        if (unknownArguments.length) {
          const expected = [...keyArguments].map((name) => `{${name}}`).join(', ') || 'none';
          throw new Error(
            `Unknown variable ${unknownArguments.map((name) => `{${name}}`).join(', ')}, expected: ${expected}`,
          );
        }
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
