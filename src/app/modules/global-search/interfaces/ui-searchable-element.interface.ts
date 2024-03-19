import { Role } from 'app/enums/role.enum';
import { GlobalSearchSection } from 'app/modules/feedback/enums/global-search-section';

export interface UiSearchableElement {
  hierarchy: string[];
  section?: GlobalSearchSection;
  anchorRouterLink?: string[];
  anchor?: string;
  triggerAnchor?: string;
  synonyms?: string[];
  requiredRoles?: Role[];
  routerLink?: string[];
  targetHref?: string;
}
