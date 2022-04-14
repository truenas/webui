import {
  ChangeDetectionStrategy, Component, Input, OnInit,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DynamicFieldsSchema } from 'app/interfaces/dynamic-fields-schema.interface';

@UntilDestroy()
@Component({
  selector: 'ix-dynamic-fields',
  styleUrls: ['./ix-dynamic-fields.component.scss'],
  templateUrl: './ix-dynamic-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class IxDynamicFieldsComponent implements OnInit {
  @Input() formGroup: FormGroup;
  @Input() fieldsFormGroupName: string;
  @Input() fields: DynamicFieldsSchema[];

  fieldsFormGroup: FormGroup;

  ngOnInit(): void {
    this.fieldsFormGroup = this.formGroup.controls[this.fieldsFormGroupName] as FormGroup;
  }
}
