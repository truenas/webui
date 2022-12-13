import {
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { MatLegacySliderChange as MatSliderChange } from '@angular/material/legacy-slider';

@Component({
  selector: 'ix-toolbar-slider',
  templateUrl: './toolbar-slider.component.html',
})
export class ToolbarSliderComponent {
  @Input() value?: number;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step? = 1;
  @Input() label?: string;
  @Input() name: string;
  @Output() valueChange = new EventEmitter<number>();

  onChange(event: MatSliderChange): void {
    this.value = event.value;
    this.valueChange.emit(this.value);
  }
}
