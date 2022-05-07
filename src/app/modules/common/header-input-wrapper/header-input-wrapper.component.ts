import {
  Component, ElementRef, EventEmitter, TemplateRef, ViewChild,
} from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'page-header-actions-wrapper',
  templateUrl: './header-input-wrapper.component.html',
  styleUrls: ['./header-input-wrapper.component.scss'],
})
export class HeaderInputWrapperComponent {
  @ViewChild('container') container: ElementRef<HTMLElement>;
  template: TemplateRef<unknown>;
  prefixIcon: string;
  reset = new EventEmitter<void>();
  shouldShowReset$: Observable<boolean>;

  clicked(): void {
    this.container.nativeElement.querySelector('input').focus();
  }
}
