import {Component, Input} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { iXAbstractObject } from 'app/core/classes/ix-abstractobject';

import { Control } from '../../models/control.interface';
import { ControlConfig } from '../../models/control-config.interface';
import { Subject } from 'rxjs/Subject';

@Component({
  selector : 'toolbar-slider',
  styleUrls : [ 'toolbar-slider.component.scss' ],
  template : `
    <div 
      class="toolbar-slider">
      {{ config.label | translate}}:
      <mat-slider [min]="config.min" [max]="config.max" [value]="config.value" [step]="config.step" (change)="onChange($event)"
			  ix-auto ix-auto-type="slider" [ix-auto-identifier]="config.label">
      </mat-slider>
    </div>
  `
})
export class ToolbarSliderComponent extends iXAbstractObject {
  @Input() config?: any;
  @Input() controller: Subject<any>;
  constructor(public translate: TranslateService) {
    super()
  }

  onChange(event){
    this.config.value = event.value;
    this.controller.next({name: this.config.name, value: this.config.value});
  }
}
