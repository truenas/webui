import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetComponent {
  @Input() showReorderHandle = false;
  @Output() back = new EventEmitter<void>();

  constructor(
    public translate: TranslateService,
  ) {}

  goBack(): void {
    this.back.emit();
  }
}
