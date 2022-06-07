import { Component, Input } from '@angular/core';
import { MatSelectChange } from '@angular/material/select/select';
import { Subject } from 'rxjs';
import { ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/modules/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'toolbar-select',
  styleUrls: ['toolbar-select.component.scss'],
  templateUrl: './toolbar-select.component.html',
})
export class ToolbarSelectComponent {
  @Input() config?: ControlConfig;
  @Input() controller: Subject<Control>;

  onChange(event: MatSelectChange): void {
    this.config.value = event.value;
    this.controller.next({ name: this.config.name, value: this.config.value });
  }
}
