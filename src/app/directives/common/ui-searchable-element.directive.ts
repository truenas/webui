import { Directive, Input } from '@angular/core';
import { Role } from 'app/enums/role.enum';

@Directive({
  selector: '[ixUiSearchableElement]',
})
export class UiSearchableElementDirective {
  @Input() uiSearchHierarchy!: string[];
  @Input() uiSearchSynonyms?: string[];
  @Input() uiSearchRequiredRoles?: Role[];
  @Input() uiSearchAnchorRouterLink?: string[];
  @Input() uiSearchTriggerAnchor?: string;
}
