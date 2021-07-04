import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'ix-form-errors',
  templateUrl: './ix-form-errors.component.html',
})
export class IXFormErrorsComponent {
  @Input() placeholder: string;
  @Input()control: FormControl;
  @Input() hideErrMsg: boolean;
}
