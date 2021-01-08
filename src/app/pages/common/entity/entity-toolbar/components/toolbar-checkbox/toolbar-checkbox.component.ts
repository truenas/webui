import {Component, Input, ViewChild, ElementRef} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { iXAbstractObject } from 'app/core/classes/ix-abstractobject';

import { Control } from '../../models/control.interface';
import { ControlConfig } from '../../models/control-config.interface';
import { Subject } from 'rxjs/Subject';

@Component({
  selector : 'toolbar-checkbox',
  styleUrls : [ 'toolbar-checkbox.component.scss' ],
  template : `
    <div class="toolbar-checkbox form-element {{ config.class}}" id="row-filter">
      <mat-checkbox color="primary" (change)="onChange($event)" ix-auto ix-auto-type="checkbox">
        {{ config.placeholder | translate }}
      </mat-checkbox>
    </div>
  `
})
export class ToolbarCheckboxComponent extends iXAbstractObject {
  @Input() config?: any;
  @Input() controller: Subject<any>;

  constructor(public translate: TranslateService) {
    super()
  }

  onChange(event){
    this.controller.next({name: this.config.name, value: event.checked});
  }

}
