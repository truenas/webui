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
 *
 * !! It's required to add anchor to the element where you do not specify hierarchy explicitly !!
 * You will get TS error if it's not provided correctly
 *

  export const customSearchableElements = {
    hierarchy: [T('System'), T('Advanced Settings'), T('Access')],
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
 * yarn extract-ui-search-elements
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

  ### Manual Render Elements
  You can add `manualRenderElements` to the config, which will force-add elements to the search result
  It will not work without specifying the desired ID it can target on the UI
  👀 see `src/app/pages/services/services.elements.ts` as an example

  ### Pending Highlight Elements
  We may have some configs which will be available after some loading indicator has been resolved
  For this case there is `pendingHighlightElement` which can be used in
  component to highlight search element when loading indicator resolved
  👀 see `src/app/pages/storage/components/dashboard-pool/dashboard-pool.component.ts` as an example
 */

import * as fs from 'fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { join } from 'path';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { extractComponentFileContent } from './extract-component-file-content';
import { findComponentFiles } from './find-component-files';
import { parseUiSearchElements } from './parse-ui-search-elements';
// TODO: Can be simplified in node 20.11+

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(fileURLToPath(import.meta.url));

let uiSearchElements: UiSearchableElement[] = [];

export async function extractUiSearchElements(): Promise<void> {
  try {
    const tsFiles = await findComponentFiles('src/**/*.elements.ts') || [];

    for (const elementsTsFilePath of tsFiles) {
      const htmlComponentFilePath = elementsTsFilePath.replace('.elements.ts', '.component.html');
      const tsComponentFilePath = elementsTsFilePath.replace('.elements.ts', '.component.ts');

      const elementConfig = await import(join(__dirname, '../../', elementsTsFilePath)) as Record<string, UiSearchableElement>;
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
