import fs from 'fs';
import { translationDir } from 'app/constants/languages.constant';

export function getLanguageFiles(dir: string = translationDir): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const languages: string[] = [];

    fs.readdir(dir, (err, files) => {
      if (err) {
        console.error('Could not list the directory.', err);
        reject(err);
        return;
      }

      files.forEach((file) => {
        if (!file.match(/\.json$/)) {
          return;
        }

        const language = file.replace(/\.json$/, '');
        languages.push(language);
      });

      resolve(languages.toSorted((a, b) => a.localeCompare(b)));
    });
  });
}
