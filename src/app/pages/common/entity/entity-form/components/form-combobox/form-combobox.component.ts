import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { Subject } from 'rxjs/Subject';
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
  textChanged: Subject<KeyboardEvent> = new Subject<KeyboardEvent>();
  constructor(public translate: TranslateService) {
    this.textChanged
      .debounceTime(500)
      .distinctUntilChanged()
      .subscribe((value) => this.updateSearchOptions(value));
  }

  onChangeOption(value) {
    this.group.controls[this.config.name].setValue(value);
  }

  updateSearchOptions(event) {
    let value = event.target.value;
    if (this.config.updater && this.config.parent) {
      if (this.config.updateLocal) {
        this.config.updater(value, this.config.parent, this.config);
      } else {
        this.config.updater(value, this.config.parent);
      }
    } else {
      value = value.toLowerCase();
      const searchOptions = [];
      for (let i = 0; i < this.config.options.length; i++) {
        if (this.config.options[i].label.toLowerCase().includes(value)) {
          searchOptions.push(this.config.options[i]);
        }
      }
      this.config.searchOptions = searchOptions;
    }
  }

  searchChanged(text: KeyboardEvent) {
    this.textChanged.next(text);
  }
}
