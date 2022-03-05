import {
  Component, Input,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox/checkbox';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/modules/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'toolbar-checkbox',
  styleUrls: ['toolbar-checkbox.component.scss'],
  templateUrl: './toolbar-checkbox.component.html',
})
export class ToolbarCheckboxComponent {
  @Input() config?: ControlConfig;
  @Input() controller: Subject<Control>;

  constructor(public translate: TranslateService) {}

  onChange(event: MatCheckboxChange): void {
    this.controller.next({ name: this.config.name, value: event.checked });
  }
}
