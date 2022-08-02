import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  templateUrl: './openstack-swift-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenstackSwiftProviderFormComponent extends BaseProviderFormComponent {
  form = this.formBuilder.group({
    user: ['', Validators.required],
    key: ['', Validators.required],
    auth: ['', Validators.required],
    auth_version: [0],

    user_id: [''],
    domain: [''],
    tenant: [''],
    tenant_id: ['', Validators.required],
    tenant_domain: [''],
    auth_token: [''],
    region: [''],
    storage_url: [''],
    endpoint_type: [''],
  });

  readonly authVersions$ = of([
    {
      label: 'Auto(vX)',
      value: 0,
    },
    {
      label: 'v1',
      value: 1,
    },
    {
      label: 'v2',
      value: 2,
    },
    {
      label: 'v3',
      value: 3,
    },
  ]);

  readonly endpointTypes$ = of([
    {
      label: 'Public',
      value: 'public',
    },
    {
      label: 'Internal',
      value: 'internal',
    },
    {
      label: 'Admin',
      value: 'admin',
    },
  ]);

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }

  get isVersion3(): boolean {
    return this.form.value.auth_version === 3;
  }

  getSubmitAttributes(): CloudCredential['attributes'] {
    const values = super.getSubmitAttributes();

    if (!this.isVersion3) {
      delete values.domain;
      delete values.tenant_domain;
      delete values.user_id;
    }

    return values;
  }
}
