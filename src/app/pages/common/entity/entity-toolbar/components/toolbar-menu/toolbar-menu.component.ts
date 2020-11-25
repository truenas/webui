import {Component, Input} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { iXAbstractObject } from 'app/core/classes/ix-abstractobject';

import { Subject } from 'rxjs';
import { ControlConfig } from '../../models/control-config.interface';
import { Control} from '../../models/control.interface';

@Component({
  selector : 'toolbar-menu',
  styleUrls : [ 'toolbar-menu.component.scss' ],
  templateUrl: 'toolbar-menu.component.html'
})
export class ToolbarMenuComponent extends iXAbstractObject {
  @Input() config?: ControlConfig; 
  @Input() controller: Subject<any>;
  constructor(public translate: TranslateService) {
    super()
  }

  onClick(value){
    this.config.value = value;
    let message:Control = {name: this.config.name, value: this.config.value}
    this.controller.next(message);
  }
}
