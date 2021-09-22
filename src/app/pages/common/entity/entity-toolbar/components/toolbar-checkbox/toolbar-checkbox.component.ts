import {
  Component, Input,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox/checkbox';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { IxAbstractObject } from 'app/core/classes/ix-abstract-object';
import { ControlConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/pages/common/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'toolbar-checkbox',
  styleUrls: ['toolbar-checkbox.component.scss'],
  templateUrl: './toolbar-checkbox.component.html',
})
export class ToolbarCheckboxComponent extends IxAbstractObject {
  @Input() config?: ControlConfig;
  @Input() controller: Subject<Control>;

  constructor(public translate: TranslateService) {
    super();
  }

  onChange(event: MatCheckboxChange): void {
    this.controller.next({ name: this.config.name, value: event.checked });
  }
}
