import {
  Component, Input,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox/checkbox';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { iXAbstractObject } from 'app/core/classes/ix-abstractobject';

@Component({
  selector: 'toolbar-checkbox',
  styleUrls: ['toolbar-checkbox.component.scss'],
  template: `
    <div class="toolbar-checkbox form-element {{ config.class}}" id="row-filter">
      <mat-checkbox color="primary" (change)="onChange($event)" ix-auto ix-auto-type="checkbox">
        {{ config.placeholder | translate }}
      </mat-checkbox>
    </div>
  `,
})
export class ToolbarCheckboxComponent extends iXAbstractObject {
  @Input() config?: any;
  @Input() controller: Subject<any>;

  constructor(public translate: TranslateService) {
    super();
  }

  onChange(event: MatCheckboxChange): void {
    this.controller.next({ name: this.config.name, value: event.checked });
  }
}
