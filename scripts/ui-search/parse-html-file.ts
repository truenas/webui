import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { AcceptedElems } from 'cheerio/lib/types';
import { Role } from 'app/enums/role.enum';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section.enum';
import { generateIdFromHierarchy } from 'app/modules/global-search/helpers/generate-id-from-hierarchy';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export function parseHtmlFile(
  filePath: string,
  elementConfig: UiSearchableElement,
  componentProperties: Record<string, string>,
): UiSearchableElement[] {
  const htmlContent = fs.readFileSync(filePath, 'utf8');
  const cheerioRoot$ = cheerio.load(htmlContent);
  const elements: UiSearchableElement[] = [];

  cheerioRoot$('[\\[ixUiSearch\\]]').each((_, element) => {
    const configKeysSplit = cheerioRoot$(element).attr('[ixuisearch]').split('.');
    const childKey = configKeysSplit[configKeysSplit.length - 1] as keyof UiSearchableElement;
    const parentKey = Object.keys(elementConfig)[0] as keyof UiSearchableElement;

    let mergedElement;

    if (
      configKeysSplit?.[configKeysSplit.length - 2] === 'elements'
    ) {
      mergedElement = mergeElementsData(cheerioRoot$, element, elementConfig, parentKey, childKey, componentProperties);
    } else {
      mergedElement = mergeElementsData(cheerioRoot$, element, elementConfig, childKey, null, componentProperties);
    }

    if (mergedElement) {
      elements.push(mergedElement);
    }
  });

  return elements;
}

function mergeElementsData(
  cheerioRoot$: (selector: string) => { attr: (attr: string) => string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: AcceptedElems<any>,
  elementConfig: UiSearchableElement,
  parentKey: keyof UiSearchableElement,
  childKey: keyof UiSearchableElement,
  componentProperties: Record<string, string>,
): UiSearchableElement {
  try {
    const parent = (elementConfig?.[parentKey] || elementConfig) as UiSearchableElement;
    const child = parent?.elements?.[childKey] || {};

    const hierarchy = [...(parent?.hierarchy || []), ...(child?.hierarchy || [])];
    const synonyms = [
      ...(parent?.synonyms || []),
      ...(child?.synonyms || []),
      ...(parent?.hierarchy?.slice(-1) || []),
    ];
    const anchorRouterLink = child?.anchorRouterLink || parent?.anchorRouterLink;
    const triggerAnchor = child?.triggerAnchor || parent?.triggerAnchor || null;
    const routerLink = parseRouterLink(cheerioRoot$(element as string).attr('[routerlink]')) ?? null;
    let requiredRoles = child.requiredRoles || parent.requiredRoles || [];

    const rolesAttrName = cheerioRoot$(element as string).attr('*ixrequiresroles') || '';

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
  } catch (error) {
    console.error(`Error extracting ${childKey}/${parentKey}`, error);
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
