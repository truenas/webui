/**
 * This is the parser which is used to generate `ui-searchable-elements.json` file, where we collect all all UI elements
 * which will be shown in new "Global UI Search"
 *
 * How to correctly set it all up:
 * 1️⃣. Use `ixUiSearchableElement` directive - to mark an element for the parser
 *
 * 2️⃣. Create .elements.ts config file near the .component.html file ~ [pools-dashboard.elements.ts]
 *
 * File content example with parent element & data which will be shared/merged to all child elements:
  export const nestedElementsWithParentPropertiesSharedToChild = {
    hierarchy: [T('System Settings'), T('Advanced'), T('Access')],
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
    },
  }

  As well we can define single element data

  export const singleSettingsExampleElements = {
    theme: {
      hierarchy: [T('System Settings'), T('General'), T('GUI'), T('Theme')],
      synonyms: [],
      triggerAnchor: 'gui-settings',
      anchorRouterLink: ['/system', 'general'],
    },
  };
 *
 * 3️⃣. Provide config to the element [ixSearchConfig]="singleSettingsExampleElements.theme"
 *
 * 4️⃣. Run the script to update `ui-searchable-elements.json`:
 * yarn extract-ui-searchable-elements
 *
 * Explanations: 👇
 *
 * export interface UiSearchableElement {
    hierarchy: string[]; ⬅️ Array of labels as a hierarchy title path to actual element, use T('')
    anchorRouterLink: string[]; ⬅️ Router link to the page with the element
    anchor: string; ⬅️ Element id where the focus will be placed eventually and will be clicked (use for buttons which are triggers for other elements, see Note down below)
    triggerAnchor?: string; ⬅️ Trigger element which will be clicked first and then focused to the anchor element -> used for forms mostly - we click Add button on the Card and open the form
    synonyms?: string[]; ⬅️ Synonyms for better search experience, use T(')
    requiredRoles?: Role[] | string[]; ⬅️ Required roles to see search result, can be skipped if `*ixRequiresRoles="requiredRoles"` applied to the element
  }

  Note: If you add `ixUiSearchableElement` to the trigger button - then in the form which will be opened by this trigger button
  you can rely on the auto-generated ID on the trigger button or add `anchor: 'my-custom-id'` prop on the trigger button
  Example: check access card -> [ixSearchConfig]="searchElements.elements.configureAccess"
  In this case I set custom anchor `#configure-access`, so in the access-form.elements.ts -> we need to provide `triggerAnchor: 'configure-access',`
 */

import * as cheerio from 'cheerio';
import * as ts from 'typescript';
import * as fs from 'fs';
import { Role } from '../src/app/enums/role.enum';
import { generateIdFromHierarchy } from '../src/app/modules/global-search/helpers/generate-id-from-hierarchy';
import { GlobalSearchSection } from '../src/app/modules/global-search/enums/global-search-section';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
const glob = require('glob');
const path = require('path');

(global as any).T = (input: string) => input;
(global as any).Role = Role;

interface ComponentProperties {
  [propertyName: string]: string;
}

enum TsExtraction {
  ElementsConfig = 'elements',
  ClassProperties = 'properties'
}

let uiElements: UiSearchableElement[] = [];

function parseRouterLink(inputText: string): string[] {
  let trimmed = inputText?.trim()?.slice(1, -1);
  return trimmed?.split(',')
    ?.map((keyword) => keyword?.trim()?.replace(/^'(.*)'$/, '$1'))
    ?.filter(Boolean);
}

function extractTsFileContent(filePath: string, extractionType: TsExtraction): string | {} {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, fileContents, ts.ScriptTarget.ES2015, true);

  let extractedElements: string;
  let properties: ComponentProperties = {};

  function visit(node: ts.Node) {
    if (extractionType === TsExtraction.ElementsConfig && ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach((declaration) => {
        if (ts.isVariableDeclaration(declaration) && declaration.name.getText(sourceFile)) {
          const initializer = declaration.initializer;
          if (initializer) {
            extractedElements = initializer.getText(sourceFile);
          }
        }
      });
    }
    if (extractionType === TsExtraction.ClassProperties && ts.isClassDeclaration(node)) {
      node.members.forEach(member => {
        if (ts.isPropertyDeclaration(member) && member.initializer) {
          const propertyName = member.name.getText(sourceFile);
          properties[propertyName] = member.initializer.getText(sourceFile);
        }
      });
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);

  return extractionType === TsExtraction.ClassProperties ? properties : extractedElements;
}

function findComponentFiles(pattern: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, (error: Error, files: string[] | PromiseLike<string[]>) => {
      error ? reject(error) : resolve(files)
    });
  });
}

function parseRoles(rolesValue: string): Role[] {
  const roleNames = rolesValue.replace(/^\[|\]$/g, '')
    ?.split(', ')
    ?.map(role => role.trim());

  return roleNames.map(roleName => Role[roleName.split('.')[1] as keyof typeof Role]).filter(Boolean);
}

// convert string config to an actual object
function convertDataStringToDataObject(dataString: string): any {
  return eval(`(${dataString})`);
}

function parseHtmlFile(
  filePath: string,
  elementConfig: string,
  componentProperties: ComponentProperties
): UiSearchableElement[] {
  const htmlContent = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(htmlContent);
  const elements: UiSearchableElement[] = [];

  $('[ixUiSearchableElement]').each((_, element) => {
    const configKeysSplitted = $(element).attr('[ixsearchconfig]').split('.');
    const childKey = configKeysSplitted[configKeysSplitted.length - 1] as string;
    const parentKey = configKeysSplitted[configKeysSplitted.length - 3];
    const configObject = convertDataStringToDataObject(elementConfig);

    let mergedElement;

    if (configKeysSplitted?.[configKeysSplitted.length - 2] === TsExtraction.ElementsConfig) {
      mergedElement = mergeElementsData($, element, configObject, parentKey, childKey, componentProperties);
    } else {
      mergedElement = mergeElementsData($, element, configObject, childKey, null, componentProperties);
    }

    if (mergedElement) {
      elements.push(mergedElement);
    }
  });

  return elements;
}

function mergeElementsData(
  $: cheerio.Root,
  element: cheerio.Element,
  elementConfig: any,
  parentKey: string,
  childKey: string,
  componentProperties: ComponentProperties
): UiSearchableElement {
  try {
    const parent = elementConfig?.[parentKey] || elementConfig;
    const child = parent?.elements?.[childKey] || {};

    const hierarchy = [...(parent?.hierarchy || []), ...(child?.hierarchy || [])];
    const synonyms = [...(parent?.synonyms || []), ...(child?.synonyms || [])];
    const anchorRouterLink = parent?.anchorRouterLink || child?.anchorRouterLink;
    const triggerAnchor = parent?.triggerAnchor || child?.triggerAnchor || null;
    const routerLink = parseRouterLink($(element).attr('[routerlink]')) ?? null;
    let requiredRoles = parent.requiredRoles || child.requiredRoles || [];

    const rolesAttrName = $(element).attr('*ixrequiresroles') || '';

    if (rolesAttrName) {
      requiredRoles = parseRoles(rolesAttrName);

      if (componentProperties[rolesAttrName]) {
        requiredRoles = parseRoles(componentProperties[rolesAttrName])
      }
    }

    return {
      hierarchy,
      synonyms,
      requiredRoles,
      anchorRouterLink,
      routerLink,
      anchor: child.anchor || parent.anchor || generateIdFromHierarchy(child.hierarchy || parent.hierarchy || []),
      triggerAnchor,
      section: GlobalSearchSection.Ui,
    };
  } catch (err) {
    console.log(`Error extracting ${childKey}/${parentKey}`);
  }
}

async function extractUiSearchableElements(): Promise<void> {
  try {
    const tsFiles = await findComponentFiles("src/**/*.elements.ts");
    tsFiles.forEach((elementsTsFilePath) => {
      const htmlComponentFilePath = elementsTsFilePath.replace('.elements.ts', '.component.html');
      const tsComponentFilePath = elementsTsFilePath.replace('.elements.ts', '.component.ts');

      if (fs.existsSync(htmlComponentFilePath)) {
        const elementConfig = extractTsFileContent(elementsTsFilePath, TsExtraction.ElementsConfig) as string;
        const componentProperties = extractTsFileContent(tsComponentFilePath, TsExtraction.ClassProperties) as {};
        const elements = parseHtmlFile(htmlComponentFilePath, elementConfig, componentProperties);
        uiElements = uiElements.concat(elements);
      }
    });

    fs.writeFileSync('src/assets/ui-searchable-elements.json', JSON.stringify(uiElements, null, 2));
  } catch (err) {
    console.error("An error occurred:", err);
  }
}

extractUiSearchableElements();
