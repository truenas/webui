import {
  Component, Input,
} from '@angular/core';
import { FieldConfig, FormDictConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';

@Component({
  selector: 'ix-wizard-summary',
  templateUrl: './wizard-summary.component.html',
  styleUrls: ['../../entity-wizard.component.scss'],
})
export class WizardSummaryComponent {
  @Input() fieldConfigs: FieldConfig[];
  @Input() value: Record<string, any>;
  @Input() isRoot: boolean;
  @Input() summary: Record<string, unknown>;

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
    } else if (fieldConfig.type === 'list' && fieldValue.length === 0) {
      result = false;
    } else if (fieldConfig.type === 'dict') {
      result = false;
      for (const key in fieldValue) {
        const subValue = fieldValue[key];
        if ((!Array.isArray(subValue) && subValue !== undefined) || (Array.isArray(subValue) && subValue.length > 0)) {
          result = true;
          break;
        }
      }
    }
    return result;
  }

  getValue(fieldConfig: FieldConfig): string {
    let result;
    const fieldValue = this.value[fieldConfig.name];
    result = fieldValue;
    if (fieldConfig.type === 'list') {
      result = fieldValue.length;
    } else if (fieldConfig.type === 'select') {
      const selectedOption = fieldConfig.options.find((option) => {
        return option.value === new EntityUtils().changeNull2String(fieldValue);
      });
      if (selectedOption) {
        result = selectedOption.label;
      }
    }
    return result;
  }

  originalOrder(): number {
    return 0;
  }

  asFormDictConfig(value: FieldConfig): FormDictConfig {
    return value as FormDictConfig;
  }
}
