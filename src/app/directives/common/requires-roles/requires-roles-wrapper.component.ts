import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'ix-requires-roles-wrapper',
  template: `
<span class="{{class + ' role-missing'}}" [matTooltip]="'Missing permissions for this action' | translate" [matTooltipPosition]="'above'">
  <ng-container *ngTemplateOutlet="template"></ng-container>
</span>
`,
  styleUrls: ['./requires-roles-wrapper.component.scss'],
})
export class RequiresRolesWrapperComponent {
  @Input() template: TemplateRef<unknown>;
  @Input() class: string;
}
