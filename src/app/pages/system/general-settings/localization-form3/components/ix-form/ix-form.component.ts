import { Component, Input } from '@angular/core';
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
}
