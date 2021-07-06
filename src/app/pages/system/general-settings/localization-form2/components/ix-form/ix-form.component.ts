import {
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'ix-form',
  templateUrl: './ix-form.component.html',
})
export class IXFormComponent {
  @Input() formGroup: FormGroup;

  @Output() formSubmit = new EventEmitter<any>();

  onSubmit(form: any): void {
    this.formSubmit.emit(form);
  }
}
