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
  @Input() title: string;
  @Output() cancel = new EventEmitter<boolean>();
  @Output() formSubmit = new EventEmitter<any>();
  @Input() loading = false;

  submitted(): void {
    this.formSubmit.emit(this.formGroup.value);
  }
}
