import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { mapToOptions } from 'app/helpers/options.helper';
import { SomeProviderAttributes } from 'app/interfaces/cloudsync-credential.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  selector: 'ix-openstack-swift-provider-form',
  templateUrl: './openstack-swift-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    DetailsTableComponent,
    DetailsItemComponent,
    EditableComponent,
    TranslateModule,
    MapValuePipe,
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
    tenant_id: [''],
    tenant_domain: [''],
    auth_token: [''],
    region: [''],
    storage_url: [''],
    endpoint_type: [''],
  });

  readonly authVersions = new Map([
    [0, 'Auto(vX)'],
    [1, 'v1'],
    [2, 'v2'],
    [3, 'v3'],
  ]);

  readonly authVersions$ = of(mapToOptions(this.authVersions, this.translate));

  readonly endpointTypes = new Map([
    ['public', 'Public'],
    ['internal', 'Internal'],
    ['admin', 'Admin'],
  ]);

  readonly endpointTypes$ = of(mapToOptions(this.endpointTypes, this.translate));

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
      this.cdr.detectChanges();
    });
  }

  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
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
