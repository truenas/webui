import { generateIdFromHierarchy } from 'app/modules/global-search/helpers/generate-id-from-hierarchy';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export function getSearchableElementId(config: UiSearchableElement): string {
  return config?.triggerAnchor || config?.anchor || generateIdFromHierarchy(config?.hierarchy || []);
}
