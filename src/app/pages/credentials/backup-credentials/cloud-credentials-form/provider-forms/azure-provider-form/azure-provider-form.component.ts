import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  templateUrl: './azure-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AzureProviderFormComponent extends BaseProviderFormComponent {
  form = this.formBuilder.group({
    account: ['', Validators.required],
    key: ['', Validators.required],
    endpoint: [''],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
