import { Component, EventEmitter, TemplateRef } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'page-header-actions-wrapper',
  templateUrl: './header-input-wrapper.component.html',
  styleUrls: ['./header-input-wrapper.component.scss'],
})
export class HeaderInputWrapperComponent {
  template: TemplateRef<any>;
  prefixIcon: string;
  reset = new EventEmitter<void>();
  shouldShowReset$: Observable<boolean>;
}
