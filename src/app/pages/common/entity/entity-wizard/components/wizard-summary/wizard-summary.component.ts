import {
  Component, Input,
} from '@angular/core';
import { FieldConfig } from '../../../entity-form/models/field-config.interface';
import { EntityUtils } from '../../../utils';

@Component({
  selector: 'wizard-summary',
  templateUrl: './wizard-summary.component.html',
  styleUrls: ['../../entity-wizard.component.scss'],
})
export class WizardSummaryComponent {
  @Input('fieldConfigs') fieldConfigs: FieldConfig[];
  @Input('value') value: any;
  @Input('isRoot') isRoot: boolean;
  @Input('summary') summary: any;

  isAutoSummary(): boolean {
    if (this.summary && Object.keys(this.summary).length > 0) {
      return false;
    }
    return true;
  }

  isVisible(fieldConfig: FieldConfig): boolean {
    let result = true;
    const fieldValue = this.value[fieldConfig.name];
    if (fieldValue === undefined) {
      result = false;
    } else if (fieldConfig.type == 'list' && fieldValue.length == 0) {
      result = false;
    }
    return result;
  }

  getValue(fieldConfig: FieldConfig): string {
    let result;
    const fieldValue = this.value[fieldConfig.name];
    result = fieldValue;
    if (fieldConfig.type == 'list') {
      result = fieldValue.length;
    } else if (fieldConfig.type == 'select') {
      const selectedOption = fieldConfig.options.find((option) => option.value == new EntityUtils().changeNull2String(fieldValue));
      if (selectedOption) {
        result = selectedOption.label;
      }
    }
    return result;
  }

  originalOrder(): number {
    return 0;
  }
}
