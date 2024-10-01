import fs from 'fs';
import * as cheerio from 'cheerio';
import glob from 'glob';

export function findIconsInTemplates(path: string): Set<string> {
  const iconNames = new Set<string>();

  const templates = glob.sync(`${path}/**/*.html`);

  templates.forEach((template) => {
    const content = fs.readFileSync(template, 'utf-8');
    const parsedTemplate = cheerio.load(content);

    parsedTemplate('ix-icon').each((_, iconTag) => {
      const name = parsedTemplate(iconTag).attr('name');
      if (name) {
        iconNames.add(name);
      }
    });
  });

  return iconNames;
}
