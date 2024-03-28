import { Role } from 'app/enums/role.enum';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section.enum';

export interface UiSearchableElement {
  hierarchy?: string[];
  section?: GlobalSearchSection;
  anchorRouterLink?: string[];
  anchor?: string;
  triggerAnchor?: string;
  synonyms?: string[];
  requiredRoles?: Role[];
  routerLink?: string[];
  targetHref?: string;
  elements?: Record<string, UiSearchableElement>;
}
