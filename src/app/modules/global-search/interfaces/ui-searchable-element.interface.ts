import { Role } from 'app/enums/role.enum';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section.enum';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';

interface UiSearchableElementBase {
  section?: GlobalSearchSection;
  /**
   * Route segments to navigate to when this entry is selected. A trailing
   * `'*'` marks "this prefix and any descendant" — used by master-detail
   * pages (e.g. `['/datasets', '*']`) so selecting an entry while already on
   * a child path (`/datasets/<pool>/<dataset>`) does not re-navigate to the
   * list root. Without the trailing `*` only an exact path match suppresses
   * navigation.
   */
  anchorRouterLink?: string[];
  triggerAnchor?: string;
  synonyms?: string[];
  requiredRoles?: Role[];
  routerLink?: string[];
  targetHref?: string;
  elements?: Record<string, UiSearchableElement>;
  manualRenderElements?: Record<string, UiSearchableElement>;
  visibleTokens?: GlobalSearchVisibleToken[];
  /**
   * When true, the highlight on this element is drawn inset (negative
   * outline-offset) so it isn't clipped by an `overflow: hidden` ancestor
   * (e.g. master-detail cards inside a scroll container). Belongs on the
   * config rather than the host directive so the same logical element looks
   * consistent across every place it renders.
   */
  inset?: boolean;
}

export type UiSearchableElementWithHierarchy = UiSearchableElementBase & {
  hierarchy: string[];
  anchor?: string;
};

export type UiSearchableElementWithAnchor = UiSearchableElementBase & {
  hierarchy?: never;
  anchor: string;
};

export type UiSearchableElement = UiSearchableElementWithHierarchy | UiSearchableElementWithAnchor;
