import { Role } from 'app/enums/role.enum';

export interface UiSearchableElement {
  hierarchy: string[];
  section?: string;
  anchorRouterLink?: string[];
  anchor?: string;
  triggerAnchor?: string;
  synonyms?: string[];
  requiredRoles?: Role[];
  routerLink?: string[];
  targetHref?: string;
}
