import {
  Component, ViewChild, AfterViewInit, AfterViewChecked, ChangeDetectorRef,
} from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';
import { FormSelectOption } from 'app/modules/entity/entity-form/models/form-select-option.interface';
import { EntityUtils, NULL_VALUE } from 'app/modules/entity/utils';

@UntilDestroy()
@Component({
  selector: 'ix-form-select',
  styleUrls: ['form-select.component.scss', '../dynamic-field/dynamic-field.scss'],
  templateUrl: './form-select.component.html',
})
export class FormSelectComponent implements Field, AfterViewInit, AfterViewChecked {
  config: FormSelectConfig;
  group: UntypedFormGroup;
  fieldShow: string;
  control: AbstractControl;

  @ViewChild('selectTrigger', { static: true }) matSelect: MatSelect;
  @ViewChild('field', { static: true }) field: MatFormField;

  formReady = false;
  selected: string;
  selectedValues: string[] = [];
  selectStates: boolean[] = []; // Collection of checkmark states
  customTriggerValue: string[];
  private _formValue: string | string[];
  private entityUtils = new EntityUtils();
  get formValue(): string | string[] {
    return this._formValue;
  }
  set formValue(value: string | string[]) {
    const result = this.config.multiple ? this.selectedValues : this.selected;
    this._formValue = result;
  }

  constructor(public translate: TranslateService, public cd: ChangeDetectorRef) {
  }

  ngAfterViewInit(): void {
    // Change the value of null to 'null_value' string
    this.config.options = this.config.options.map((option) => {
      if (!option.hasOwnProperty('value')) {
        // TODO: Check if this support is actually needed.
        option = { label: (option as any), value: option };
      }

      option.value = this.entityUtils.changeNull2String(option.value);

      return option;
    });
    this.selectStates = this.config.options.map(() => false);

    this.control = this.group.controls[this.config.name];

    // When the default value is null, Change it to 'null_value' string
    if (this.control.value === null) {
      this.control.setValue(NULL_VALUE);
    }

    // if control has a value on init
    if (this.control.value && this.control.value.length > 0) {
      this.selectedValues = this.control.value;
      // check if any value is invalid
      if (this.config.multiple && this.config.asyncValidation) {
        for (const value of this.control.value) {
          if (_.find(this.config.options, { value }) === undefined) {
            this.config.options.push({ label: value + '(invalid)', value });
          }
        }
      }
    }
    this.control.valueChanges.pipe(untilDestroyed(this)).subscribe((evt: string | string[]) => {
      // When set the value to null, Change it to 'null_value' string
      if (this.control.value === null) {
        this.control.setValue(NULL_VALUE);
      }

      if (evt) {
        if (this.config.multiple && Array.isArray(evt)) {
          this.selectedValues = evt.map((item) => {
            // When set the value to null, Change it to 'null_value' string
            if (item === null) {
              item = NULL_VALUE;
            }
            return item;
          });
          const newStates = this.config.options.map((item) => this.selectedValues.includes(item.value));
          const triggerValue: string[] = [];
          this.config.options.forEach((option) => {
            if (this.selectedValues.includes(option.value)) {
              triggerValue.push(option.label);
            }
          });
          this.selectStates = newStates;
          this.customTriggerValue = triggerValue;
        }
      }
    });
  }

  linkClicked(): void {
    if (this.config.linkClicked) {
      this.config.linkClicked();
    }
  }

  ngAfterViewChecked(): void {
    if (this.formReady || typeof this.config.options === 'undefined' || !this.config.options || this.config.options.length <= 0) {
      return;
    }

    const newStates = this.config.options.map((item) => item && this.selectedValues.includes(item.value));
    this.selectStates = newStates;
    this.updateValues();
    this.formReady = true;
    this.cd.detectChanges();
  }

  onChangeOption($event: MatSelectChange): void {
    if (this.config.onChangeOption !== undefined && this.config.onChangeOption !== null) {
      this.config.onChangeOption({ event: $event });
    }
  }

  onSelect(option: FormSelectOption): void {
    this.selected = option.value;
    this.group.value[this.config.name] = this.selected;
    this.formValue = this.selected;
  }

  isDisabled(index: number): boolean {
    const option = this.config.options[index];
    return option.disabled ? option.disabled : false;
  }

  onToggleSelect(option: FormSelectOption): void {
    if (!this.config.multiple) {
      this.onSelect(option);
      return;
    }

    this.group.value[this.config.name] = this.selectedValues;
  }

  updateValues(): void {
    const newValues: string[] = [];
    const triggerValue: string[] = [];
    this.selectStates.forEach((item, index) => {
      if (item) {
        newValues.push(this.config.options[index].value);
        triggerValue.push(this.config.options[index].label);
      }
    });
    this.selectedValues = newValues;
    this.customTriggerValue = triggerValue;
    this.formValue = '';
  }
}
