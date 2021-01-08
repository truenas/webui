import {Component, Input} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { iXAbstractObject } from 'app/core/classes/ix-abstractobject';

import { Control } from '../../models/control.interface';
import { ControlConfig } from '../../models/control-config.interface';
import { Subject } from 'rxjs/Subject';

@Component({
  selector : 'toolbar-button',
  styleUrls : [ 'toolbar-button.component.scss' ],
  template : `
    <div 
      class="toolbar-button" [class.has-tooltip]="config.tooltip">
      <button
        ix-auto ix-auto-type="button" [ix-auto-identifier]="id + '_entity_toolbar_' + config.label"
        (click)="onClick(true)"
        [color]="config.color ? config.color : 'default'"
        mat-button
        [disabled]="config.disabled">
        {{ config.label | translate }}
      </button>
      <tooltip *ngIf="config.tooltip" [header]="config.placeholder" [message]="config.tooltip" [position]="config.tooltipPosition ? config.tooltipPosition : left"></tooltip>
    </div>
  `
})
export class ToolbarButtonComponent extends iXAbstractObject {
  @Input() config?: any;
  @Input() controller: Subject<any>;
  constructor(public translate: TranslateService) {
    super()
  }

  onClick(value){
    this.config.value = value;
    this.controller.next({name: this.config.name, value: this.config.value});
  }
}
