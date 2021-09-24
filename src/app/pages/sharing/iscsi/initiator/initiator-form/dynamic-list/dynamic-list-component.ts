import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, AbstractControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';

@UntilDestroy()
@Component({
  selector: 'app-dynamic-list',
  templateUrl: './dynamic-list.component.html',
  styleUrls: ['./dynamic-list.component.scss'],
})
export class DynamicListComponent implements OnInit {
  @Input() config: any;
  @Input() group: FormGroup;
  @Input() source: any;

  listControl: AbstractControl;
  inputConfig: FieldConfig;
  inputControl: AbstractControl;
  formGroup: FormGroup;
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
    this.listControl.statusChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      const method = res === 'DISABLED' ? 'disable' : 'enable';
      this.inputControl[method]();
    });
  }

  add(): void {
    if (this.inputControl.value !== null && this.inputControl.value !== undefined && this.inputControl.value !== '') {
      this.listControl.value.add(this.inputControl.value);
      this.inputControl.setValue(null);
    }
  }

  remove(item: any): void {
    this.listControl.value.delete(item);
  }

  drop(): void {
    this.config.customEventMethod(this);
  }
}
