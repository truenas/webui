import {
  Component, EventEmitter, forwardRef, Input, Output,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { InputAlert } from 'app/interfaces/input-alert.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { ValueAccessorParent } from 'app/pages/system/general-settings/localization-form2/components/value-accessor-parent.class';
import { DialogService } from 'app/services';
import { T } from 'app/translate-marker';

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
export class IXSelectComponent extends ValueAccessorParent {
  @Input('multiple') multiple = false;
  @Input('options') options: Option[] = [];
  @Input('alert') alert: InputAlert;

  @Output() optionChange: EventEmitter<MatSelectChange> = new EventEmitter();

  private disableAlert = false;
  protected selectedValues: any = {};
  customTriggerValues: string[];

  constructor(private dialogService: DialogService) {
    super();
  }

  onSelect(option: any): void {
    if (this.alert) {
      this.showAlert(option);
    }
    this.value = option.value;
  }

  onToggleSelect(selectedOption: Option): void {
    if (!this.multiple) {
      this.onSelect(selectedOption);
      return;
    }

    this.selectedValues[selectedOption.value] = !this.selectedValues[selectedOption.value];

    if (this.selectedValues[selectedOption.value] && this.shouldAlertOnOption(selectedOption)) {
      this.showAlert(selectedOption);
    }

    this.value = Object.keys(this.selectedValues).filter((key) => this.selectedValues[key]);
    this.customTriggerValues = this.options.filter((option) => this.selectedValues[option.value])
      .map((option) => option.label);
  }

  onOptionChanged($event: MatSelectChange): void {
    if (this.optionChange !== undefined && this.optionChange != null) {
      this.optionChange.emit($event);
    }
  }

  shouldAlertOnOption(option: any): boolean {
    return this.alert ? this.alert.forValues.findIndex((v: string | number) => v == option.value) >= 0 : false;
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
    this.dialogService.dialogForm(conf);
  }
}
