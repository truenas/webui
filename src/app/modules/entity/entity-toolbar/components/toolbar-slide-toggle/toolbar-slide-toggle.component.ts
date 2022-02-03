import { Component, Input } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { IxAbstractObject } from 'app/core/classes/ix-abstract-object';
import { ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/modules/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'toolbar-slide-toggle',
  templateUrl: './toolbar-slide-toggle.component.html',
  styleUrls: ['toolbar-slide-toggle.component.scss'],
})
export class ToolbarSlideToggleComponent extends IxAbstractObject {
  @Input() config?: ControlConfig;
  @Input() controller: Subject<Control>;

  constructor(public translate: TranslateService) {
    super();
  }

  onChanged(event: MatSlideToggleChange): void {
    console.info('onChanged', event);
    this.config.value = event.checked;
    this.controller.next({ name: this.config.name, value: event.checked });
  }

  getIdentifier(): string {
    if (this.config.ixAutoIdentifier) {
      return this.config.ixAutoIdentifier;
    }
    return `${this.id}_entity_toolbar_${this.config.label}`;
  }
}
