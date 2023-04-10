import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, of } from 'rxjs';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  templateUrl: './openstack-swift-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenstackSwiftProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
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
  private formPatcher$ = new BehaviorSubject<CloudCredential['attributes']>({});

  getFormSetter$ = (): BehaviorSubject<CloudCredential['attributes']> => {
    return this.formPatcher$;
  };

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
    });
  }
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
