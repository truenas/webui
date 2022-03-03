import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { getUniqueId } from 'app/helpers/get-unique-id.helper';
import { ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/modules/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'toolbar-menu',
  templateUrl: 'toolbar-menu.component.html',
})
export class ToolbarMenuComponent {
  @Input() config?: ControlConfig;
  @Input() controller: Subject<Control>;

  id = getUniqueId();

  constructor(public translate: TranslateService) {}

  onClick(value: any): void {
    this.config.value = value;
    const message: Control = { name: this.config.name, value: this.config.value };
    this.controller.next(message);
  }
}
