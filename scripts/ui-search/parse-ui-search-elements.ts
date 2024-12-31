import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { uniq } from 'lodash-es';
import { Role } from 'app/enums/role.enum';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section.enum';
import { generateIdFromHierarchy } from 'app/modules/global-search/helpers/generate-id-from-hierarchy';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

// TODO: This should be just cheerio.Element, but the type is not available in commonjs
// https://github.com/cheeriojs/cheerio/issues/4067
type CheerioElement = Parameters<typeof cheerio.contains>[0];

export function parseUiSearchElements(
  htmlComponentFilePath: string,
  elementConfig: Record<string, UiSearchableElement>,
  componentProperties: Record<string, string>,
): UiSearchableElement[] {
  const cheerioRoot$ = cheerio.load(fs.readFileSync(htmlComponentFilePath, 'utf8'));
  const elements: UiSearchableElement[] = [];
  const parentKey = Object.keys(elementConfig)[0] as keyof UiSearchableElement;
  const manualRenderElements = elementConfig[parentKey].manualRenderElements;

  if (manualRenderElements) {
    Object.keys(manualRenderElements).forEach((childKey) => {
      const mergedElement = createUiSearchElement(
        cheerioRoot$,
        null,
        elementConfig,
        parentKey,
        childKey as keyof UiSearchableElement,
        componentProperties,
      );

      if (mergedElement) {
        elements.push(mergedElement);
      }
    });
  }

  cheerioRoot$('[\\[ixUiSearch\\]]').each((_, element) => {
    const configKeysSplit = cheerioRoot$(element).attr('[ixuisearch]').split('.');
    const childKey = configKeysSplit[configKeysSplit.length - 1] as keyof UiSearchableElement;

    const mergedElement = createUiSearchElement(
      cheerioRoot$,
      element,
      elementConfig,
      parentKey,
      childKey,
      componentProperties,
    );

    if (mergedElement) {
      elements.push(mergedElement);
    }
  });

  return uniq(elements);
}

function createUiSearchElement(
  cheerioRoot$: (selector: CheerioElement | string) => { attr: (attr: string) => string },
  element: CheerioElement,
  elementConfig: Record<string, UiSearchableElement>,
  parentKey: keyof UiSearchableElement,
  childKey: keyof UiSearchableElement,
  componentProperties: Record<string, string>,
): UiSearchableElement {
  try {
    const parent = (elementConfig?.[parentKey] || elementConfig) as UiSearchableElement;
    const child = parent?.elements?.[childKey]
      || parent?.manualRenderElements?.[childKey]
      || {} as UiSearchableElement;

    const hierarchy = [...parent?.hierarchy || [], ...child?.hierarchy || []];
    const visibleTokens = [...parent?.visibleTokens || [], ...child?.visibleTokens || []];

    const synonyms = [...new Set([
      ...(parent?.synonyms || []),
      ...(child?.synonyms || []),
      ...hierarchy,
    ])].filter((synonym) => !hierarchy.includes(synonym));

    const anchorRouterLink = child?.anchorRouterLink || parent?.anchorRouterLink;
    const triggerAnchor = child?.triggerAnchor || parent?.triggerAnchor || null;
    const routerLink = parseRouterLink(cheerioRoot$(element).attr('[routerlink]')) ?? null;
    let requiredRoles = child.requiredRoles || parent.requiredRoles || [];

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
      visibleTokens,
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
