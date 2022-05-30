import {
  Component, Input,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox/checkbox';
import { Subject } from 'rxjs';
import { ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/modules/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'ix-toolbar-checkbox',
  styleUrls: ['toolbar-checkbox.component.scss'],
  templateUrl: './toolbar-checkbox.component.html',
})
export class ToolbarCheckboxComponent {
  @Input() config?: ControlConfig;
  @Input() controller: Subject<Control>;

  onChange(event: MatCheckboxChange): void {
    this.controller.next({ name: this.config.name, value: event.checked });
  }
}
