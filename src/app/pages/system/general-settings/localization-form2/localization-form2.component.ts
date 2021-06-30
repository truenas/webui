import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-localization-form',
  templateUrl: 'localization-form2.component.html',
  styleUrls: ['./localization-form2.component.scss'],
  providers: [],
})
export class LocalizationForm2Component {
  selectOptions = [
    { label: 'Rehan', value: 'rehan' },
    { label: 'Noman', value: 'noman' },
    { label: 'Rabia', value: 'Rabia' },
  ];

  onSubmit(form: NgForm): void {
    form;
  }
}
