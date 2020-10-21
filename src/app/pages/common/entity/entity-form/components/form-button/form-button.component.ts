import {Component} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';

@Component({
  selector : 'form-button',
  template : `
    <div 
      class="dynamic-field form-element"
      [formGroup]="group">

      <button 
        mat-button 
        [class]="config.buttonClass ? config.buttonClass : 'form-button'"
        [color]="config.buttonColor ? config.buttonColor : default" type="button" 
        (click)="config.customEventMethod($event)" 
        [disabled]="config.disabled" 
        *ngIf="!config['isHidden']"
        ix-auto ix-auto-type="button" ix-auto-identifier="{{config.customEventActionLabel}}">
          {{config.customEventActionLabel | translate}}
      </button>
    </div>
  `
})
export class FormButtonComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  constructor(public translate: TranslateService) {}
}
