import { Component } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatSelectionListChange } from '@angular/material/list';
import { FormSelectionListConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@Component({
  templateUrl: './form-selection-list.component.html',
  styleUrls: ['./form-selection-list.component.scss'],
})
export class FormSelectionListComponent implements Field {
  config: FormSelectionListConfig;
  group: UntypedFormGroup;
  fieldShow: string;

  get selectionListLayout(): string {
    return this.config.inlineFields ? 'row wrap' : 'column';
  }

  get listOptionFlex(): string {
    if (this.selectionListLayout === 'column') return '100%';

    if (this.selectionListLayout === 'row wrap' && this.config.inlineFieldFlex) {
      return this.config.inlineFieldFlex;
    }
    return '50%';
  }

  onChangeSelectedItems($event: MatSelectionListChange): void {
    if (this.config.onChange) {
      this.config.onChange($event);
    }
  }
}
