import { Component, TemplateRef } from '@angular/core';

@Component({
  selector: 'page-header-actions-wrapper',
  templateUrl: './header-input-wrapper.component.html',
  styleUrls: ['./header-input-wrapper.component.scss'],
})
export class HeaderInputWrapperComponent {
  template: TemplateRef<any>;
  prefixIcon: string;
}
