import { generateIdFromHierarchy } from 'app/modules/global-search/helpers/generate-id-from-hierarchy';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export function getSearchableElementId(config: UiSearchableElement): string {
  return config?.anchor || config?.triggerAnchor || generateIdFromHierarchy(config?.hierarchy || []);
}
