import {
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-form',
  styleUrls: ['./ix-form.component.scss'],
  templateUrl: './ix-form.component.html',
})
export class IxForm {
  @Input() formGroup: FormGroup;
  @Output() cancel = new EventEmitter<boolean>();
  loading = false;

  formSubmit(): void {
    // console.log('formGroup', this.formGroup.value);
    // console.log('valid', this.formGroup.valid);
    // console.log('errors', this.formGroup.errors);
    // for (const control in this.formGroup.controls) {
    //   console.log(control, this.formGroup.controls[control].value);
    // }
  }
}
