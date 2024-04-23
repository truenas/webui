import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'ix-widget',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetComponent {
  @Input() showReorderHandle = false;
  @Output() back = new EventEmitter<void>();

  goBack(): void {
    this.back.emit();
  }
}
