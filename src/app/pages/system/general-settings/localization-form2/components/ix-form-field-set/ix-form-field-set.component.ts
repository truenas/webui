import { Component, Input } from '@angular/core';
import { FormFieldInlinePlacement } from 'app/pages/system/general-settings/localization-form2/enums/form-field-inline-placement.enum';

@Component({
  template: `
    <div class="fieldset-container fieldset-display-default">
      <div class="entity-form fieldset divider-{{divider}}">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  selector: 'ix-form-field-set',
})
export class IXFormFieldSet {
  readonly FormFieldInlinePlacement = FormFieldInlinePlacement;

  @Input()
  divider: boolean;
  @Input()
  formFieldInlinePlacement: FormFieldInlinePlacement;
}
