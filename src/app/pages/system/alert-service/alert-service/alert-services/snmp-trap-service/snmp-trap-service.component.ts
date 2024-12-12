import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AlertServiceEdit } from 'app/interfaces/alert-service.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';

const disabledValue = 'disabled';

@Component({
  selector: 'ix-snmp-trap-service',
  templateUrl: './snmp-trap-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    TranslateModule,
  ],
})
export class SnmpTrapServiceComponent extends BaseAlertServiceForm {
  form = this.formBuilder.group({
    host: ['', Validators.required],
    port: [162],
    v3: [false],
    v3_username: ['', this.validators.validateOnCondition((control) => control.parent && this.isV3, Validators.required)],
    v3_authkey: [''],
    v3_privkey: [''],
    v3_authprotocol: [''],
    v3_privprotocol: [''],
    community: ['public'],
  });

  readonly authProtocols$ = of([
    {
      label: this.translate.instant('Disabled'),
      value: disabledValue,
    },
    {
      label: 'MD5',
      value: 'MD5',
    },
    {
      label: 'SHA',
      value: 'SHA',
    },
    {
      label: 'HMAC128SHA224',
      value: '128SHA224',
    },
    {
      label: 'HMAC192SHA256',
      value: '192SHA256',
    },
    {
      label: 'HMAC256SHA384',
      value: '256SHA384',
    },
    {
      label: 'HMAC384SHA512',
      value: '384SHA512',
    },
  ]);

  readonly privProtocols$ = of([
    {
      label: this.translate.instant('Disabled'),
      value: disabledValue,
    },
    {
      label: 'DES',
      value: 'DES',
    },
    {
      label: '3DES-EDE',
      value: '3DESEDE',
    },
    {
      label: 'CFB128-AES-128',
      value: 'AESCFB128',
    },
    {
      label: 'CFB128-AES-192',
      value: 'AESCFB192',
    },
    {
      label: 'CFB128-AES-256',
      value: 'AESCFB256',
    },
    {
      label: 'CFB128-AES-192 Blumenthal',
      value: 'AESBLUMENTHALCFB192',
    },
    {
      label: 'CFB128-AES-256 Blumenthal',
      value: 'AESBLUMENTHALCFB256',
    },
  ]);

  get isV3(): boolean {
    return this.form.controls.v3.value;
  }

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private validators: IxValidatorsService,
  ) {
    super();
  }

  override setValues(values: AlertServiceEdit['attributes']): void {
    super.setValues({
      ...values,
      v3_authprotocol: values.v3_authprotocol || disabledValue,
      v3_privprotocol: values.v3_privprotocol || disabledValue,
    });
  }

  override getSubmitAttributes(): AlertServiceEdit['attributes'] {
    const values = this.form.value;
    let attributes: AlertServiceEdit['attributes'] = {
      host: values.host,
      port: values.port,
      v3: values.v3,
      community: values.community,
    } as AlertServiceEdit['attributes'];

    if (values.v3) {
      attributes = {
        ...attributes,
        v3_username: values.v3_username,
        v3_authkey: values.v3_authkey,
        v3_privkey: values.v3_privkey,
        v3_authprotocol: values.v3_authprotocol === disabledValue ? null : values.v3_authprotocol,
        v3_privprotocol: values.v3_privprotocol === disabledValue ? null : values.v3_privprotocol,
      };
    }

    return attributes;
  }
}
