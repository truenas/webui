import { Component } from '@angular/core';
import { FormGroup, NgForm } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FormFieldInlinePlacement } from 'app/pages/system/general-settings/localization-form2/enums/form-field-inline-placement.enum';

@UntilDestroy()
@Component({
  selector: 'app-localization-form',
  templateUrl: 'localization-form2.component.html',
  providers: [],
})
export class LocalizationForm2Component {
  selectOptions = [
    { label: 'Rehan', value: 'rehan' },
    { label: 'Noman', value: 'noman' },
    { label: 'Rabia', value: 'Rabia' },
  ];

  readonly FormFieldInlinePlacement = FormFieldInlinePlacement;

  formGroup: FormGroup;
  onSubmit(form: NgForm): void {
    form;
  }
}
