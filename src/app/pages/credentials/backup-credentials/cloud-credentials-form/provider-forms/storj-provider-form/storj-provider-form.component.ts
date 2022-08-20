import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  templateUrl: './storj-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorjProviderFormComponent extends BaseProviderFormComponent {
  form = this.formBuilder.group({
    access_key_id: ['', Validators.required],
    secret_access_key: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
