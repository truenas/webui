import { Role } from 'app/enums/role.enum';

export interface UiSearchableElement {
  hierarchy: string[];
  anchorRouterLink: string[];
  anchor?: string;
  triggerAnchor?: string;
  synonyms?: string[];
  requiredRoles?: Role[];
  routerLink?: string[];
}
