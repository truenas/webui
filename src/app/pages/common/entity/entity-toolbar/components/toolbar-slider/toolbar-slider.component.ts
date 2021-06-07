import { Component, Input } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider/slider';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { iXAbstractObject } from 'app/core/classes/ix-abstractobject';

@Component({
  selector: 'toolbar-slider',
  styleUrls: ['toolbar-slider.component.scss'],
  template: `
    <div
      class="toolbar-slider">
      {{ config.label | translate}}:
      <mat-slider [min]="config.min" [max]="config.max" [value]="config.value" [step]="config.step" (change)="onChange($event)"
			  ix-auto ix-auto-type="slider" [ix-auto-identifier]="config.label">
      </mat-slider>
    </div>
  `,
})
export class ToolbarSliderComponent extends iXAbstractObject {
  @Input() config?: any;
  @Input() controller: Subject<any>;
  constructor(public translate: TranslateService) {
    super();
  }

  onChange(event: MatSliderChange): void {
    this.config.value = event.value;
    this.controller.next({ name: this.config.name, value: this.config.value });
  }
}
