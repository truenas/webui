import {Component, Input} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { iXAbstractObject } from 'app/core/classes/ix-abstractobject';

import { Control } from '../../models/control.interface';
import { ControlConfig } from '../../models/control-config.interface';
import { Subject } from 'rxjs/Subject';

@Component({
  selector : 'toolbar-select',
  styleUrls : [ 'toolbar-select.component.scss' ],
  template : `
    <div class="form-element dynamic-field form-select">
      <mat-form-field>
        <mat-select [(ngModel)]="config.selectedValue" (selectionChange)="onChange($event)">
          <div>
            <mat-selection-list>
              <ng-container *ngFor="let option of config.options; let i=index">
                <mat-option [value]="option.value">
                  {{ option.label | translate }}
                </mat-option>
              </ng-container>
            </mat-selection-list>
          </div>
        </mat-select>
      </mat-form-field>
    </div>
  `
})
export class ToolbarSelectComponent extends iXAbstractObject {
  @Input() config?: any;
  @Input() controller: Subject<any>;
  selectedValue: string;

  constructor(public translate: TranslateService) {
    super();
  }

  onChange(event){
    this.config.value = event.value;
    this.controller.next({name: this.config.name, value: this.config.value});
  }
}
