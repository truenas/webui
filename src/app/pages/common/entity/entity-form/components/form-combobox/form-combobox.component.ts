import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';

import * as _ from 'lodash';

@Component({
  selector: 'form-combobox',
  styleUrls: ['form-combobox.component.scss', '../dynamic-field/dynamic-field.css'],
  templateUrl: './form-combobox.component.html',
})
export class FormComboboxComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  constructor(public translate: TranslateService) {}

  onChangeOption(value) {
    this.group.controls[this.config.name].setValue(value);
  }

  updateSearchOptions(value) {
    value = value.toLowerCase();
    if(this.config.updater && this.config.parent) {
      if (this.config.updateLocal) {
        this.config.updater(value, this.config.parent, this.config);
      } else {
        this.config.updater(value, this.config.parent);
      }
    } else {
      let searchOptions = [];
      for (let i = 0; i < this.config.options.length; i++) {
        if (_.startsWith(this.config.options[i].label.toLowerCase(), value)) {
          searchOptions.push(this.config.options[i]);
        }
      }
      this.config.searchOptions = searchOptions;
    }
  }
}
