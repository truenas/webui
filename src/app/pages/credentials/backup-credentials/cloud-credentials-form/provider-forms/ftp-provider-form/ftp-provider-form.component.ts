import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  templateUrl: './ftp-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FtpProviderFormComponent extends BaseProviderFormComponent {
  form = this.formBuilder.group({
    host: ['', Validators.required],
    port: [null as number],
    user: ['', Validators.required],
    pass: [''],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
