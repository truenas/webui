import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FormFieldInlinePlacement } from 'app/pages/system/general-settings/localization-form2/enums/form-field-inline-placement.enum';

@UntilDestroy()
@Component({
  selector: 'app-localization-form2',
  templateUrl: 'localization-form2.component.html',
  providers: [],
})
export class LocalizationForm2Component {
  constructor(private router: Router) {}
  selectOptions = [
    { label: 'Rehan', value: 'rehan' },
    { label: 'Noman', value: 'noman' },
    { label: 'Rabia', value: 'Rabia' },
  ];

  readonly FormFieldInlinePlacement = FormFieldInlinePlacement;

  formGroup: FormGroup;
  onSubmit(form: any): void {
    form;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
