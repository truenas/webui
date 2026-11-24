/**
 * Generates `ui-searchable-elements.json` from `ixUiSearch` usages for the global UI search; run it with
 * `yarn extract-ui-search-elements`. How to mark and configure elements: docs/devs/ui-search.md.
 */

import * as fs from 'fs';
import { join } from 'path';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { extractComponentFileContent } from './extract-component-file-content';
import { findComponentFiles } from './find-component-files';
import { parseUiSearchElements } from './parse-ui-search-elements';

let uiSearchElements: UiSearchableElement[] = [];

export async function extractUiSearchElements(): Promise<void> {
  try {
    const tsFiles = await findComponentFiles('src/**/*.elements.ts') || [];

    for (const elementsTsFilePath of tsFiles) {
      const htmlComponentFilePath = elementsTsFilePath.replace('.elements.ts', '.component.html');
      const tsComponentFilePath = elementsTsFilePath.replace('.elements.ts', '.component.ts');

      const elementConfig = await import(join(import.meta.dirname, '../../', elementsTsFilePath)) as Record<string, UiSearchableElement>;
      const componentProperties = extractComponentFileContent(tsComponentFilePath);
      const uiSearchHtmlElements = parseUiSearchElements(htmlComponentFilePath, elementConfig, componentProperties);

      uiSearchElements = uiSearchElements.concat([...uiSearchHtmlElements]);
    }

    fs.writeFileSync(
      'src/assets/ui-searchable-elements.json',
      JSON.stringify(uiSearchElements, null, 2),
    );
  } catch (err) {
    console.error('An error occurred:', err);
  }
}

extractUiSearchElements();
