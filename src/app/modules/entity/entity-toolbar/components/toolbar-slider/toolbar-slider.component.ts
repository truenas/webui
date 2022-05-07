import { Component, Input } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider/slider';
import { Subject } from 'rxjs';

export interface ToolbarSliderConfig {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  name: string;
}

@Component({
  selector: 'toolbar-slider',
  templateUrl: './toolbar-slider.component.html',
})
export class ToolbarSliderComponent {
  @Input() config?: ToolbarSliderConfig;
  @Input() controller: Subject<{ name: string; value: number }>;

  onChange(event: MatSliderChange): void {
    this.config.value = event.value;
    this.controller.next({ name: this.config.name, value: this.config.value });
  }
}
