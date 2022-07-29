import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  templateUrl: './backblaze-b2-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackblazeB2ProviderFormComponent extends BaseProviderFormComponent {
  form = this.formBuilder.group({
    account: ['', Validators.required],
    key: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
