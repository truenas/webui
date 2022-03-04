import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { getUniqueId } from 'app/helpers/get-unique-id.helper';
import { ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/modules/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'toolbar-button',
  templateUrl: './toolbar-button.component.html',
  styleUrls: ['toolbar-button.component.scss'],
})
export class ToolbarButtonComponent {
  @Input() config?: ControlConfig;
  @Input() controller: Subject<Control>;

  id = getUniqueId();

  constructor(public translate: TranslateService) {}

  onClick(value: true): void {
    this.config.value = value;
    this.controller.next({ name: this.config.name, value: this.config.value });
  }

  getIdentifier(): string {
    if (this.config.ixAutoIdentifier) {
      return this.config.ixAutoIdentifier;
    }
    return `${this.id}_entity_toolbar_${this.config.label}`;
  }
}
