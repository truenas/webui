import { Role } from 'app/enums/role.enum';

export interface UiSearchableElement {
  hierarchy: string[];
  anchorRouterLink: string[];
  anchor: string;
  synonyms?: string[];
  requiredRoles?: Role[] | string[];
  routerLink?: string[];
  focusNavigationPath?: string;
  triggerAnchor?: string;
}
