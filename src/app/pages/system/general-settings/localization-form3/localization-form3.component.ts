import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Option } from 'app/interfaces/option.interface';

@UntilDestroy()
@Component({
  selector: 'app-localization3',
  templateUrl: './localization-form3.component.html',
  styleUrls: ['./localization-form3.component.scss'],
})
export class LocalizationForm3 implements OnInit {
  form: FormGroup;
  name = 'Rehan2';
  sibling = 'john';

  formTitle = 'Personal Info';

  nameTooltip = 'This is a tip!';
  namePlaceholder = 'E.g., Rehan';
  readonly nameFormControlName = 'name';

  siblingLabel = 'Sibling';
  siblingTooltip = 'This is another tip!';
  siblingOptions: Option[] = [
    { label: 'Rehan', value: 'rehan' },
    { label: 'John', value: 'john' },
    { label: 'Steve', value: 'steve' },
  ];
  readonly siblingFormControlName = 'sibling';

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      sibling: ['steve', [Validators.required]],
    });
  }

  cancelled(): void {
    // console.log('cancelled')
  }

  submit(): void { // (value: any) {
    // console.log("form submitted", value);
  }

  constructor(private fb: FormBuilder) {}
}
