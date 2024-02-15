import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'ix-requires-roles-wrapper',
  template: `
<span [class]="['role-missing', class]" [matTooltip]="'Missing permissions for this action' | translate" matTooltipPosition="above">
  <ng-container *ngTemplateOutlet="template"></ng-container>
  <ix-icon name="lock" class="role-missing-icon"></ix-icon>
</span>
`,
  styleUrls: ['./requires-roles-wrapper.component.scss'],
})
export class RequiresRolesWrapperComponent {
  @Input() template: TemplateRef<unknown>;
  @Input() class: string;
}
