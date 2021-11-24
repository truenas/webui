import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import helptext from 'app/helptext/services/components/service-dynamic-dns';
import { DynamicDnsConfig } from 'app/interfaces/dynamic-dns.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { WebSocketService, ValidationService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'dynamicdns-edit',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class ServiceDDNSComponent implements FormConfiguration {
  addCall = 'dyndns.update' as const;
  title = helptext.formTitle;
  routeSuccess: string[] = ['services'];

  fieldSets = new FieldSets([
    {
      name: helptext.fieldset_general,
      label: true,
      width: '49%',
      config: [
        {
          type: 'select',
          name: 'provider',
          placeholder: helptext.provider_placeholder,
          tooltip: helptext.provider_tooltip,
          options: [],
        },
        {
          type: 'checkbox',
          name: 'checkip_ssl',
          placeholder: helptext.checkip_ssl_placeholder,
          tooltip: helptext.checkip_ssl_tooltip,
        },
        {
          type: 'input',
          name: 'checkip_server',
          placeholder: helptext.checkip_server_placeholder,
          tooltip: helptext.checkip_server_tooltip,
        },
        {
          type: 'input',
          name: 'checkip_path',
          placeholder: helptext.checkip_path_placeholder,
          tooltip: helptext.checkip_path_tooltip,
        },
        {
          type: 'checkbox',
          name: 'ssl',
          placeholder: helptext.ssl_placeholder,
          tooltip: helptext.ssl_tooltip,
        },
        {
          type: 'input',
          name: 'custom_ddns_server',
          placeholder: helptext.custom_ddns_server_placeholder,
          tooltip: helptext.custom_ddns_server_tooltip,
          disabled: true,
          isHidden: true,
        },
        {
          type: 'input',
          name: 'custom_ddns_path',
          placeholder: helptext.custom_ddns_path_placeholder,
          tooltip: helptext.custom_ddns_path_tooltip,
          disabled: true,
          isHidden: true,
        },
        {
          type: 'input',
          name: 'domain',
          required: true,
          placeholder: helptext.domain_placeholder,
          tooltip: helptext.domain_tooltip,
        },
        {
          type: 'input',
          name: 'period',
          placeholder: helptext.period_placeholder,
          tooltip: helptext.period_tooltip,
        },
      ],
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext.fieldset_access,
      label: true,
      width: '49%',
      config: [
        {
          type: 'input',
          name: 'username',
          placeholder: helptext.username_placeholder,
          tooltip: helptext.username_tooltip,
          required: true,
        },
        {
          type: 'input',
          name: 'password',
          placeholder: helptext.password_placeholder,
          tooltip: helptext.password_tooltip,
          inputType: 'password',
          togglePw: true,
        },
        {
          type: 'input',
          name: 'password2',
          placeholder: helptext.password2_placeholder,
          inputType: 'password',
          validation: this.validationService.matchOtherValidator('password'),
        },
      ],
    },
    { name: 'divider', divider: true },
  ]);

  protected provider: FormSelectConfig;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected validationService: ValidationService,
  ) {}

  afterInit(entityForm: EntityFormComponent): void {
    this.ws.call('dyndns.config').pipe(untilDestroyed(this)).subscribe((config) => {
      entityForm.formGroup.controls['provider'].setValue(config.provider);
      entityForm.formGroup.controls['checkip_ssl'].setValue(config.checkip_ssl);
      entityForm.formGroup.controls['checkip_server'].setValue(config.checkip_server);
      entityForm.formGroup.controls['checkip_path'].setValue(config.checkip_path);
      entityForm.formGroup.controls['ssl'].setValue(config.ssl);
      entityForm.formGroup.controls['custom_ddns_server'].setValue(config.custom_ddns_server);
      entityForm.formGroup.controls['custom_ddns_path'].setValue(config.custom_ddns_path);
      if (!config.domain) {
        entityForm.formGroup.controls['domain'].setValue([]);
      } else {
        entityForm.formGroup.controls['domain'].setValue(config.domain);
      }
      entityForm.formGroup.controls['username'].setValue(config.username);
      entityForm.formGroup.controls['period'].setValue(config.period);
    });
    entityForm.submitFunction = this.submitFunction;

    entityForm.formGroup.controls['provider'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      if (res === 'custom') {
        this.hideField('custom_ddns_server', false, entityForm);
        this.hideField('custom_ddns_path', false, entityForm);
      } else {
        this.hideField('custom_ddns_server', true, entityForm);
        this.hideField('custom_ddns_path', true, entityForm);
      }
    });
  }

  clean(value: any): any {
    delete value['password2'];

    return value;
  }

  submitFunction(entityForm: any): Observable<DynamicDnsConfig> {
    if (entityForm.domain.length === 0) {
      entityForm.domain = [];
    }
    if (typeof entityForm.domain === 'string') {
      entityForm.domain = entityForm.domain.split(/[\s,\t|{}()\[\]"']+/);
    }
    return this.ws.call('dyndns.update', [entityForm]);
  }

  preInit(): void {
    this.provider = this.fieldSets.config('provider') as FormSelectConfig;
    this.ws.call('dyndns.provider_choices').pipe(untilDestroyed(this)).subscribe((res) => {
      for (const key in res) {
        this.provider.options.push({ label: res[key], value: key });
      }
      this.provider.options.push({ label: 'Custom Provider', value: 'custom' });
    });
  }

  hideField(fieldName: string, show: boolean, entity: EntityFormComponent): void {
    this.fieldSets.config(fieldName).isHidden = show;
    entity.setDisabled(fieldName, show, show);
  }
}
