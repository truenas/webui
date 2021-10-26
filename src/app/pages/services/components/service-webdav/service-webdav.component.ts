import {
  ApplicationRef, Component, Injector,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import helptext from 'app/helptext/services/components/service-webdav';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { WebdavConfig, WebdavConfigUpdate } from 'app/interfaces/webdav-config.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { SystemGeneralService, WebSocketService, ValidationService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'webdav-edit',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [SystemGeneralService],
})
export class ServiceWebdavComponent implements FormConfiguration {
  queryCall = 'webdav.config' as const;
  editCall = 'webdav.update' as const;
  route_success: string[] = ['services'];
  title = helptext.formTitle;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_title,
      width: '100%',
      label: true,
      config: [
        {
          type: 'select',
          name: 'protocol',
          placeholder: helptext.protocol_placeholder,
          tooltip: helptext.protocol_tooltip,
          options: helptext.protocol_options,
        },
        {
          type: 'input',
          name: 'tcpport',
          placeholder: helptext.tcpport_placeholder,
          tooltip: helptext.tcpport_tooltip,
        },
        {
          type: 'input',
          name: 'tcpportssl',
          placeholder: helptext.tcpportssl_placeholder,
          tooltip: helptext.tcpportssl_tooltip,
        },
        {
          type: 'select',
          name: 'certssl',
          placeholder: helptext.certssl_placeholder,
          tooltip: helptext.certssl_tooltip,
          options: [{ label: '---', value: null }],
        },
        {
          type: 'select',
          name: 'htauth',
          placeholder: helptext.htauth_placeholder,
          tooltip: helptext.htauth_tooltip,
          options: helptext.htauth_options,
        },
        {
          type: 'input',
          name: 'password',
          placeholder: helptext.password_placeholder,
          togglePw: true,
          tooltip: helptext.password_tooltip,
          inputType: 'password',
        },
        {
          type: 'input',
          name: 'password2',
          placeholder: helptext.password2_placeholder,
          inputType: 'password',
          validation: this.validationService.matchOtherValidator('password'),
        },
      ],
    }];

  private webdav_protocol: FormControl;
  private webdav_tcpport: FieldConfig;
  private webdav_tcpportssl: FieldConfig;
  private webdav_certssl: FormSelectConfig;
  private webdav_htauth: FormControl;
  private webdav_password: FieldConfig;
  private webdav_password2: FieldConfig;
  private entityForm: EntityFormComponent;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected systemGeneralService: SystemGeneralService,
    protected validationService: ValidationService,
  ) {}

  resourceTransformIncomingRestData(data: WebdavConfig): any {
    const transformed = { ...data };
    const certificate = data['certssl'];
    if (certificate && certificate.id) {
      transformed['certssl'] = certificate.id;
    }
    delete transformed['password'];
    return transformed;
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.entityForm.submitFunction = this.submitFunction;
    this.webdav_tcpport = _.find(this.fieldConfig, { name: 'tcpport' });
    this.webdav_tcpportssl = _.find(this.fieldConfig, { name: 'tcpportssl' });
    this.webdav_password = _.find(this.fieldConfig, { name: 'password' });
    this.webdav_password2 = _.find(this.fieldConfig, { name: 'password2' });
    this.webdav_htauth = entityForm.formGroup.controls['htauth'] as FormControl;
    this.webdav_protocol = entityForm.formGroup.controls['protocol'] as FormControl;
    this.handleProtocol(this.webdav_protocol.value);
    this.handleAuth(this.webdav_htauth.value);
    this.webdav_protocol.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value: string) => {
        this.handleProtocol(value);
      });
    this.webdav_htauth.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value: string) => {
        this.handleAuth(value);
      });

    this.webdav_certssl = _.find(this.fieldConfig, { name: 'certssl' }) as FormSelectConfig;
    this.systemGeneralService.getCertificates().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res.length > 0) {
        res.forEach((item) => {
          this.webdav_certssl.options.push(
            { label: item.name, value: item.id },
          );
        });
      }
    });
  }

  handleProtocol(value: string): void {
    if (value === 'HTTP') {
      this.webdav_tcpport['isHidden'] = false;
      this.webdav_tcpportssl['isHidden'] = true;
      this.webdav_certssl['isHidden'] = true;
    } else if (value === 'HTTPS') {
      this.webdav_tcpport['isHidden'] = true;
      this.webdav_tcpportssl['isHidden'] = false;
      this.webdav_certssl['isHidden'] = false;
    } else if (value === 'HTTPHTTPS') {
      this.webdav_tcpport['isHidden'] = false;
      this.webdav_tcpportssl['isHidden'] = false;
      this.webdav_certssl['isHidden'] = false;
    }
  }

  handleAuth(value: string): void {
    if (value === 'NONE') {
      this.entityForm.setDisabled('password', true, true);
      this.entityForm.setDisabled('password2', true, true);
    } else {
      this.entityForm.setDisabled('password', false, false);
      this.entityForm.setDisabled('password2', false, false);
    }
  }

  submitFunction(body: WebdavConfigUpdate & { password2?: string }): Observable<WebdavConfig> {
    delete body['password2'];
    return this.ws.call('webdav.update', [body]);
  }
}
