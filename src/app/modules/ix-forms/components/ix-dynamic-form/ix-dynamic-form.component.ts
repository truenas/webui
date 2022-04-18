import {
  ChangeDetectionStrategy, Component, Input, OnInit,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DynamicFormSchema } from 'app/interfaces/dynamic-form-schema.interface';

@UntilDestroy()
@Component({
  selector: 'ix-dynamic-form',
  styleUrls: ['./ix-dynamic-form.component.scss'],
  templateUrl: './ix-dynamic-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class IxDynamicFormComponent implements OnInit {
  @Input() formGroup: FormGroup;
  @Input() fieldsFormGroupName: string;
  @Input() fields: DynamicFormSchema[];

  fieldsFormGroup: FormGroup;

  ngOnInit(): void {
    this.fieldsFormGroup = this.formGroup.controls[this.fieldsFormGroupName] as FormGroup;
  }
}
