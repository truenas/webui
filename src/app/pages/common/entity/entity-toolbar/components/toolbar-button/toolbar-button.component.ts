import {Component, Input} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

//import {FieldConfig} from '../../models/field-config.interface';
//import {Field} from '../../models/field.interface';
import { Control } from '../../models/control.interface';
import { ControlConfig } from '../../models/control-config.interface';
import { Subject } from 'rxjs/Subject';

@Component({
  selector : 'toolbar-button',
  styleUrls : [ 'toolbar-button.component.scss' ],
  template : `
    <div 
      class="toolbar-button">
      <button
        (click)="onClick(true)"
        [color]="config.color ? config.color : 'default'"
        mat-button
        [disabled]="config.disabled">
        {{ config.label | translate }}
      </button>
    </div>
  `
})
export class ToolbarButtonComponent {
  @Input() config?: any;
  @Input() controller: Subject<any>;
  constructor(public translate: TranslateService) {}

  onClick(value){
    this.config.value = value;
    this.controller.next({name: this.config.name, value: this.config.value});
  }
}
