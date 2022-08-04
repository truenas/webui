import {
  ChangeDetectionStrategy, Component, ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  templateUrl: './pcloud-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PcloudProviderFormComponent extends BaseProviderFormComponent {
  @ViewChild(OauthProviderComponent, { static: true }) oauthComponent: OauthProviderComponent;

  form = this.formBuilder.group({
    token: ['', Validators.required],
    hostname: [''],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }

  onOauthAuthenticated(attributes: Record<string, unknown>): void {
    this.form.patchValue(attributes);
  }

  getSubmitAttributes(): OauthProviderComponent['form']['value'] & this['form']['value'] {
    return {
      ...this.oauthComponent.form.value,
      ...this.form.value,
    };
  }

  setValues(values: CloudCredential['attributes']): void {
    this.form.patchValue(values);
    this.oauthComponent.form.patchValue(values);
  }
}
