import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  templateUrl: './s3-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class S3ProviderFormComponent extends BaseProviderFormComponent {
  form = this.formBuilder.group({
    access_key_id: ['', Validators.required],
    secret_access_key: ['', Validators.required],

    max_upload_parts: [null as number],
    endpoint: [''],
    region: [''],
    skip_region: [false],
    signatures_v2: [false],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
