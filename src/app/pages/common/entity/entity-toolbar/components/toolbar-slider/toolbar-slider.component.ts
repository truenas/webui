import { Component, Input } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider/slider';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { IxAbstractObject } from 'app/core/classes/ix-abstract-object';

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
export class ToolbarSliderComponent extends IxAbstractObject {
  @Input() config?: ToolbarSliderConfig;
  @Input() controller: Subject<{ name: string; value: number }>;
  constructor(public translate: TranslateService) {
    super();
  }

  onChange(event: MatSliderChange): void {
    this.config.value = event.value;
    this.controller.next({ name: this.config.name, value: this.config.value });
  }
}
