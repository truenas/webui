import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { IxAbstractObject } from 'app/core/classes/ix-abstract-object';
import { ControlConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/pages/common/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'toolbar-button',
  templateUrl: './toolbar-button.component.html',
  styleUrls: ['toolbar-button.component.scss'],
})
export class ToolbarButtonComponent extends IxAbstractObject {
  @Input() config?: ControlConfig;
  @Input() controller: Subject<Control>;
  constructor(public translate: TranslateService) {
    super();
  }

  onClick(value: any): void {
    this.config.value = value;
    this.controller.next({ name: this.config.name, value: this.config.value });
  }
}
