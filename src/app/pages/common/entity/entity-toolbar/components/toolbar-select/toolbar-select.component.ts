import { Component, Input } from '@angular/core';
import { MatSelectChange } from '@angular/material/select/select';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { IxAbstractObject } from 'app/core/classes/ix-abstract-object';

@Component({
  selector: 'toolbar-select',
  styleUrls: ['toolbar-select.component.scss'],
  templateUrl: './toolbar-select.component.html',
})
export class ToolbarSelectComponent extends IxAbstractObject {
  @Input() config?: any;
  @Input() controller: Subject<any>;
  selectedValue: string;

  constructor(public translate: TranslateService) {
    super();
  }

  onChange(event: MatSelectChange): void {
    this.config.value = event.value;
    this.controller.next({ name: this.config.name, value: this.config.value });
  }
}
