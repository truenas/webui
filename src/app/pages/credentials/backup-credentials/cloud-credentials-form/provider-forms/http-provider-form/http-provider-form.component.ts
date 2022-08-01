import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  templateUrl: './http-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpProviderFormComponent extends BaseProviderFormComponent {
  form = this.formBuilder.group({
    url: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
