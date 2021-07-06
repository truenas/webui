import { Component, Input } from '@angular/core';
import { FormFieldInlinePlacement } from 'app/pages/system/general-settings/localization-form2/enums/form-field-inline-placement.enum';

@Component({
  templateUrl: './ix-form-field-set.component.html',
  selector: 'ix-form-field-set',
})
export class IXFormFieldSet {
  readonly FormFieldInlinePlacement = FormFieldInlinePlacement;

  @Input()
  label: string;
  @Input()
  divider: boolean;
  @Input()
  formFieldInlinePlacement: FormFieldInlinePlacement;
}
