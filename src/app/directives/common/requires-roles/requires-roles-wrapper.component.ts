import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'ix-requires-roles-wrapper',
  templateUrl: './requires-roles-wrapper.component.html',
  styleUrls: ['./requires-roles-wrapper.component.scss'],
})
export class RequiresRolesWrapperComponent {
  @Input() template: TemplateRef<unknown>;
  @Input() class: string;
}
