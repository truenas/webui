import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * TODO: This is a stupid copy of form-errors from entity module.
 * TODO: Refactor.
 */
@Component({
  selector: 'ix-form-errors',
  templateUrl: './ix-form-errors.component.html',
})
export class IxFormErrorsComponent {
  @Input() control: AbstractControl;
  @Input() label: string;
}
