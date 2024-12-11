import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SomeProviderAttributes } from 'app/interfaces/cloudsync-credential.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  selector: 'ix-openstack-swift-provider-form',
  templateUrl: './openstack-swift-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    TranslateModule,
  ],
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

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
      this.cdr.detectChanges();
    });
  }

  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  get isVersion3(): boolean {
    return this.form.value.auth_version === 3;
  }

  override getSubmitAttributes(): SomeProviderAttributes {
    const values = super.getSubmitAttributes();

    if (!this.isVersion3) {
      delete values.domain;
      delete values.tenant_domain;
      delete values.user_id;
    }

    return values;
  }
}
