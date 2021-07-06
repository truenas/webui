import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component, EventEmitter, forwardRef, Input, Output, ViewChild,
} from '@angular/core';
import {
  AsyncValidatorFn, FormControl, FormGroup, NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { InputAlert } from 'app/interfaces/input-alert.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityUtils, NULL_VALUE } from 'app/pages/common/entity/utils';
import { ValueAccessorParent } from 'app/pages/system/general-settings/localization-form2/components/value-accessor-parent.class';
import { DialogService } from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'ix-select',
  templateUrl: 'ix-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IXSelectComponent),
      multi: true,
    },
  ],
})
export class IXSelectComponent extends ValueAccessorParent implements AfterViewInit, AfterViewChecked {
  @Input() alert?: InputAlert;
  @Input() asyncValidation?: AsyncValidatorFn | AsyncValidatorFn[];
  @Input() hideErrMsg?: boolean;
  @Input() inlineLabel?: string;
  @Input() isHidden?: boolean;
  @Input() isLoading?: boolean;
  @Input() multiple?: boolean;
  @Input() name: string;
  @Input() options?: Option[];
  @Input() placeholder?: string;
  @Input() hasErrors?: boolean;
  @Input() required?: boolean;
  @Input() tooltip?: string;
  @Input() tooltipPosition?: string;
  @Input() divider?: boolean;
  @Input() warnings?: string;
  @Input() zeroStateMessage?: string;
  @Input() formInline: boolean;

  @Input() formControlName: string;
  @Input() formGroup: FormGroup;
  @Output() selectionChange = new EventEmitter<MatSelectChange>();

  fieldShow: string;
  formControl: any = new FormControl(null);

  @ViewChild('selectTrigger', { static: true }) matSelect: MatSelect;
  @ViewChild('field', { static: true }) field: MatFormField;

  formReady = false;
  selected: any;
  allSelected: boolean;
  private disableAlert = false;
  selectedValues: any[] = [];
  selectStates: boolean[] = []; // Collection of checkmark states
  selectAllStateCache: boolean[] = []; // Cache the state when select all was toggled
  selectAllValueCache: boolean[] = []; // Cache the state when select all was toggled
  customTriggerValue: any;
  private _formValue: any;
  private entityUtils = new EntityUtils();
  get formValue(): any {
    return this._formValue;
  }
  set formValue(value: any) {
    const result = this.multiple ? this.selectedValues : this.selected;
    this._formValue = result;
  }

  constructor(public translate: TranslateService, private dialog: DialogService, public cd: ChangeDetectorRef) {
    super();
  }

  ngAfterViewInit(): void {
    // Change the value of null to 'null_value' string
    this.options = this.options.map((option) => {
      option.value = this.entityUtils.changeNull2String(option.value);

      return option;
    });
    this.selectStates = this.options.map(() => false);

    // When the default value is null, Change it to 'null_value' string
    if (this.formControl.value === null) {
      this.formControl.value = NULL_VALUE;
    }

    // if control has a value on init
    if (this.formControl.value && this.formControl.value.length > 0) {
      this.selectedValues = this.formControl.value;
      // check if any value is invalid
      if (this.multiple && this.asyncValidation) {
        for (const v of this.formControl.value) {
          if (_.find(this.options, { value: v }) === undefined) {
            this.options.push({ label: v + '(invalid)', value: v });
          }
        }
      }
    }
    this.formControl.valueChanges.pipe(untilDestroyed(this)).subscribe((evt: any) => {
      // When set the value to null, Change it to 'null_value' string
      if (this.formControl.value === null) {
        this.formControl.value = NULL_VALUE;
      }

      if (evt) {
        if (this.multiple && Array.isArray(evt)) {
          this.selectedValues = evt.map((item) => {
            // When set the value to null, Change it to 'null_value' string
            if (item === null) {
              item = NULL_VALUE;
            }
            return item;
          });
          const newStates = this.options.map((item) => this.selectedValues.indexOf(item.value) !== -1);
          const triggerValue = [];
          for (let i = 0; i < this.options.length; i++) {
            const item = this.options[i];
            if (this.selectedValues.indexOf(item.value) !== -1) {
              triggerValue.push(item.label);
            }
          }
          this.selectStates = newStates;
          this.customTriggerValue = triggerValue;
        }
      }
    });
  }

  ngAfterViewChecked(): void {
    if (!this.formReady && typeof this.options !== 'undefined' && this.options && this.options.length > 0) {
      const newStates = this.options.map((item) => item && this.selectedValues.indexOf(item.value) !== -1);
      this.selectStates = newStates;
      this.updateValues();
      this.formReady = true;
      this.cd.detectChanges();
    }
  }

  optionChanged($event: MatSelectChange): void {
    this.selectionChange.emit($event);
  }

  showAlert(option: any): void {
    if (!this.shouldAlertOnOption(option) || this.disableAlert) return;

    const conf: DialogFormConfiguration = {
      title: T('Alert'),
      message: this.alert.message,
      hideCancel: true,
      fieldConfig: [
        {
          type: 'checkbox',
          name: 'disable_alert',
          placeholder: T('Don\'t show this message again'),
        },
      ],
      saveButtonText: T('OK'),
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close(true);
        if (entityDialog.formValue.disable_alert) {
          this.disableAlert = true;
        }
      },
    };
    this.dialog.dialogForm(conf);
  }

  onSelect(option: any): void {
    if (this.alert) {
      this.showAlert(option);
    }
    this.selected = option.value;
    this.formValue = this.selected;
    this.value = option.value;
  }

  onToggleSelectAll(): void {
    if (!this.allSelected) {
      // Cache all the things...
      this.selectAllStateCache = Object.assign([], this.selectStates);// cache the checkmark states
      this.selectAllValueCache = Object.assign([], this.selectedValues);// cache the values

      // Deal with the values...
      const newValues = this.options.map((item) => item.value);
      this.selectedValues = newValues;

      // Deal with checkmark states...
      this.selectStates.fill(true);

      // ensure all template elements that care, know that everything is selected
      this.allSelected = true;
    } else {
      this.selectStates = this.selectAllStateCache;
      this.selectedValues = this.selectAllValueCache;
      this.allSelected = false;
    }

    // let testOption = this.matSelect.options._results[0];
  }

  isDisabled(index: number): boolean {
    const option = this.options[index];
    return option && option.disabled ? option.disabled : false;
  }

  isHiddenFromDisplay(index: number): boolean {
    const option = this.options[index];
    return option.hiddenFromDisplay ? option.hiddenFromDisplay : false;
  }

  onToggleSelect(option: any): void {
    if (!this.multiple) {
      this.onSelect(option);
      return;
    }

    if (this.selectedValues.findIndex((v) => v === option.value) >= 0 && this.alert) {
      this.showAlert(option);
    }
    this.value = this.selectedValues;
  }

  updateValues(): void {
    const newValues: any[] = [];
    const triggerValue: any[] = [];
    this.selectStates.forEach((item, index) => {
      if (item) {
        newValues.push(this.options[index].value);
        triggerValue.push(this.options[index].label);
      }
    });
    this.selectedValues = newValues;
    this.customTriggerValue = triggerValue;
    this.formValue = '';
  }

  shouldAlertOnOption(option: any): boolean {
    return this.alert ? this.alert.forValues.findIndex((v: string | number) => v === option.value) >= 0 : false;
  }
}
