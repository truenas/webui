/* eslint-disable no-restricted-imports */
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { TsExtraction } from './ts-extraction.enum';
import { Role } from '../../src/app/enums/role.enum';
import { GlobalSearchSection } from '../../src/app/modules/global-search/enums/global-search-section.enum';
import { generateIdFromHierarchy } from '../../src/app/modules/global-search/helpers/generate-id-from-hierarchy';

(global as unknown as { T: unknown }).T = (input: string) => input;
(global as unknown as { Role: unknown }).Role = Role;

function convertDataStringToDataObject(dataString: string): unknown {
  // eslint-disable-next-line no-eval
  return eval(`(${dataString})`);
}

export function parseHtmlFile(
  filePath: string,
  elementConfig: string,
  componentProperties: Record<string, string>,
): UiSearchableElement[] {
  const htmlContent = fs.readFileSync(filePath, 'utf8');
  const cheerioRoot$ = cheerio.load(htmlContent);
  const elements: UiSearchableElement[] = [];

  cheerioRoot$('[ixUiSearchableElement]').each((_, element) => {
    const configKeysSplitted = cheerioRoot$(element).attr('[ixsearchconfig]').split('.');
    const childKey = configKeysSplitted[configKeysSplitted.length - 1] as keyof UiSearchableElement;
    const parentKey = configKeysSplitted[configKeysSplitted.length - 3] as keyof UiSearchableElement;
    const configObject = convertDataStringToDataObject(elementConfig);

    let mergedElement;

    if (
      configKeysSplitted?.[configKeysSplitted.length - 2] as keyof UiSearchableElement === TsExtraction.ElementsConfig
    ) {
      mergedElement = mergeElementsData(cheerioRoot$, element, configObject, parentKey, childKey, componentProperties);
    } else {
      mergedElement = mergeElementsData(cheerioRoot$, element, configObject, childKey, null, componentProperties);
    }

    if (mergedElement) {
      elements.push(mergedElement);
    }
  });

  return elements;
}

function mergeElementsData(
  cheerioRoot$: cheerio.Root,
  element: cheerio.Element,
  elementConfig: UiSearchableElement,
  parentKey: keyof UiSearchableElement,
  childKey: keyof UiSearchableElement,
  componentProperties: Record<string, string>,
): UiSearchableElement {
  try {
    const parent = (elementConfig?.[parentKey] || elementConfig) as UiSearchableElement;
    const child = parent?.elements?.[childKey] || {};

    const hierarchy = [...(parent?.hierarchy || []), ...(child?.hierarchy || [])];
    const synonyms = [...(parent?.synonyms || []), ...(child?.synonyms || [])];
    const anchorRouterLink = parent?.anchorRouterLink || child?.anchorRouterLink;
    const triggerAnchor = parent?.triggerAnchor || child?.triggerAnchor || null;
    const routerLink = parseRouterLink(cheerioRoot$(element).attr('[routerlink]')) ?? null;
    let requiredRoles = parent.requiredRoles || child.requiredRoles || [];

    const rolesAttrName = cheerioRoot$(element).attr('*ixrequiresroles') || '';

    if (rolesAttrName) {
      requiredRoles = parseRoles(rolesAttrName);

      if (componentProperties[rolesAttrName]) {
        requiredRoles = parseRoles(componentProperties[rolesAttrName]);
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
    console.error(`Error extracting ${childKey}/${parentKey}`);
    return null;
  }
}

function parseRouterLink(inputText: string): string[] {
  const trimmed = inputText?.trim()?.slice(1, -1);
  return trimmed?.split(',')
    ?.map((keyword) => keyword?.trim()?.replace(/^'(.*)'$/, '$1'))
    ?.filter(Boolean);
}

function parseRoles(rolesValue: string): Role[] {
  const roleNames = rolesValue.replace(/^\[|\]$/g, '')
    ?.split(', ')
    ?.map((role) => role.trim());

  return roleNames.map((roleName) => Role[roleName.split('.')[1] as keyof typeof Role]).filter(Boolean);
}
