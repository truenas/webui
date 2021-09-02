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
  siblingOptions: Option[] = [
    { label: 'Rehan', value: 'rehan' },
    { label: 'John', value: 'john' },
    { label: 'Steve', value: 'steve' },
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      sibling: ['steve', [Validators.required]],
    });
  }

  cancelled(): void {
    // console.log('cancelled')
  }
  constructor(private fb: FormBuilder) {}
}
