import { Component, OnInit, Input } from '@angular/core';
import { UntypedFormGroup, AbstractControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FieldConfig, FormInputListConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';

@UntilDestroy()
@Component({
  selector: 'ix-dynamic-list',
  templateUrl: './dynamic-list.component.html',
  styleUrls: ['./dynamic-list.component.scss'],
})
export class DynamicListComponent implements OnInit {
  @Input() config: FormInputListConfig;
  @Input() group: UntypedFormGroup;

  listControl: AbstractControl;
  inputConfig: FieldConfig;
  inputControl: AbstractControl;
  formGroup: UntypedFormGroup;
  constructor(private entityFormService: EntityFormService) { }

  ngOnInit(): void {
    // define input config and control
    this.inputConfig = {
      type: 'input',
      name: this.config.name + '_input',
      placeholder: this.config.placeholder,
      tooltip: this.config.tooltip,
      validation: this.config.validation ? this.config.validation : [],
    };
    this.formGroup = this.entityFormService.createFormGroup([this.inputConfig]);
    this.inputControl = this.formGroup.controls[this.inputConfig.name];

    this.listControl = this.group.controls[this.config.name];

    if (this.config.validation) {
      this.inputControl.setValidators(this.inputConfig.validation);
      this.inputControl.updateValueAndValidity();
    }

    if (this.listControl.value === undefined) {
      this.listControl.setValue(new Set([]));
    }
    this.listControl.statusChanges.pipe(untilDestroyed(this)).subscribe((status) => {
      const method = status === 'DISABLED' ? 'disable' : 'enable';
      this.inputControl[method]();
    });
  }

  add(): void {
    if (this.inputControl.value !== null && this.inputControl.value !== undefined && this.inputControl.value !== '') {
      this.listControl.value.add(this.inputControl.value);
      this.inputControl.setValue(null);
    }
  }

  remove(item: unknown): void {
    this.listControl.value.delete(item);
  }

  drop(): void {
    this.config.customEventMethod(this);
  }
}
