import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  templateUrl: './mega-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MegaProviderFormComponent extends BaseProviderFormComponent {
  form = this.formBuilder.group({
    user: ['', Validators.required],
    pass: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
