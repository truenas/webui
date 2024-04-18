/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * This is the parser which is used to generate `ui-searchable-elements.json` file, where we collect all all UI elements
 * which will be shown in new "Global UI Search"
 *
 * How to correctly set it all up:
 * 1️⃣. Use `ixUiSearch` directive - to mark an element for the parser
 *
 * 2️⃣. Create .elements.ts config file near the .component.html file ~ [pools-dashboard.elements.ts]
 *
 * Example of creating a new searchable element:

  export const customSearchableElements = {
    hierarchy: [T('System'), T('Advanced'), T('Access')],
    anchorRouterLink: ['/system', 'advanced'],
    elements: {
      configureAccess: {
        hierarchy: [T('Configure')],
        synonyms: [T('Configure Sessions')],
      },
      terminateOtherSessions: {
        hierarchy: [T('Terminate Other Sessions')],
        synonyms: [T('Terminate Other User Sessions')],
      },
    } satisfies UiSearchableElement,
  }

 *
 * 3️⃣. Provide config to the element [ixUiSearch]="singleSettingsExampleElements.theme"
 *
 * 4️⃣. Run the script to update `ui-searchable-elements.json`:
 * yarn extract-ui-searchable-elements
 *
 * Explanations: 👇
 *
 * export interface UiSearchableElement {
    hierarchy: string[]; ⬅️ Array of labels as a hierarchy title path to actual element, use T('')
    anchorRouterLink: string[]; ⬅️ Router link to the page with the element
    anchor: string; ⬅️ Element id where the focus will be placed eventually and will be
    clicked (use for buttons which are triggers for other elements, see Note down below)
    triggerAnchor?: string; ⬅️ Trigger element which will be clicked first and then focused to the
    anchor element -> used for forms mostly - we click Add button on the Card and open the form
    synonyms?: string[]; ⬅️ Synonyms for better search experience, use T(')
    requiredRoles?: Role[] | string[]; ⬅️ Required roles to see search result, can be skipped
    if `*ixRequiresRoles="requiredRoles"` applied to the element
  }

  Note: If you add `ixUiSearch` to the trigger button - then in the
  form which will be opened by this trigger button
  you can rely on the auto-generated ID on the trigger button or add `anchor: 'my-custom-id'` prop on the trigger button
  Example: check access card -> [ixUiSearch]="searchableElements.elements.configureAccess"
  In this case I set custom anchor `#configure-access`, so in the access-form.elements.ts -> we need to
  provide `triggerAnchor: 'configure-access',`
 */

import * as fs from 'fs';
import { join } from 'path';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { extractComponentFileContent } from './extract-component-file-content';
import { findComponentFiles } from './find-component-files';
import { parseHtmlFile } from './parse-html-file';

let uiElements: UiSearchableElement[] = [];

export async function extractUiSearchableElements(): Promise<void> {
  try {
    const tsFiles = await findComponentFiles('src/**/*.elements.ts') || [];

    tsFiles.forEach((elementsTsFilePath) => {
      const htmlComponentFilePath = elementsTsFilePath.replace('.elements.ts', '.component.html');
      const tsComponentFilePath = elementsTsFilePath.replace('.elements.ts', '.component.ts');

      if (fs.existsSync(htmlComponentFilePath)) {
        const elementConfig = require(join(__dirname, '../../', elementsTsFilePath)) as UiSearchableElement;
        const componentProperties = extractComponentFileContent(tsComponentFilePath);
        const elements = parseHtmlFile(htmlComponentFilePath, elementConfig, componentProperties);
        uiElements = uiElements.concat(elements);
      }
    });

    fs.writeFileSync('src/assets/ui-searchable-elements.json', JSON.stringify(uiElements, null, 2));
  } catch (err) {
    console.error('An error occurred:', err);
  }
}

extractUiSearchableElements();
