import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-dynamic-dns';

@Component({
  selector : 'dynamicdns-edit',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class ServiceDDNSComponent {
  // protected resource_name = 'services/dynamicdns';
  protected addCall = 'dyndns.update';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'provider',
      placeholder : helptext.provider_placeholder,
      tooltip: helptext.provider_tooltip,
      options : []
    },
    {
      type : 'checkbox',
      name : 'checkip_ssl',
      placeholder : helptext.checkip_ssl_placeholder,
      tooltip: helptext.checkip_ssl_tooltip,
    },
    {
      type : 'input',
      name : 'checkip_server',
      placeholder : helptext.checkip_server_placeholder,
      tooltip: helptext.checkip_server_tooltip,
    },
    {
      type : 'input',
      name : 'checkip_path',
      placeholder : helptext.checkip_path_placeholder,
      tooltip: helptext.checkip_path_tooltip,
    },
    {
      type : 'checkbox',
      name : 'ssl',
      placeholder : helptext.ssl_placeholder,
      tooltip: helptext.ssl_tooltip,
    },
    {
      type: 'input',
      name: 'custom_ddns_server',
      placeholder: helptext.custom_ddns_server_placeholder,
      tooltip: helptext.custom_ddns_server_tooltip,
      disabled: true,
      isHidden: true
    },
    {
      type: 'input',
      name: 'custom_ddns_path',
      placeholder: helptext.custom_ddns_path_placeholder,
      tooltip: helptext.custom_ddns_path_tooltip,
      disabled: true,
      isHidden: true
    },
    {
      type : 'input',
      name : 'domain',
      placeholder : helptext.domain_placeholder,
      tooltip: helptext.domain_tooltip,
    },
    {
      type : 'input',
      name : 'username',
      placeholder : helptext.username_placeholder,
      tooltip: helptext.username_tooltip,
      required: true
    },
    {
      type : 'input',
      name : 'password',
      placeholder : helptext.password_placeholder,
      tooltip: helptext.password_tooltip,
      inputType : 'password',
      togglePw: true,
      validation : helptext.password_validation,
    },
    {
      type : 'input',
      name : 'password2',
      placeholder : helptext.password2_placeholder,
      inputType : 'password',
    },
    {
      type : 'input',
      name : 'period',
      placeholder : helptext.period_placeholder,
      tooltip: helptext.period_tooltip,
    },
  ];

  protected provider: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityForm: any) {
    entityForm.ws.call('dyndns.config').subscribe((res)=>{
      entityForm.formGroup.controls['provider'].setValue(res.provider);
      entityForm.formGroup.controls['checkip_ssl'].setValue(res.checkip_ssl);
      entityForm.formGroup.controls['checkip_server'].setValue(res.checkip_server);
      entityForm.formGroup.controls['checkip_path'].setValue(res.checkip_path);
      entityForm.formGroup.controls['ssl'].setValue(res.ssl);
      entityForm.formGroup.controls['custom_ddns_server'].setValue(res.custom_ddns_server);
      entityForm.formGroup.controls['custom_ddns_path'].setValue(res.custom_ddns_path);
      if(!res.domain) {
        entityForm.formGroup.controls['domain'].setValue([]);
      } else {
        entityForm.formGroup.controls['domain'].setValue(res.domain);
      }
      entityForm.formGroup.controls['username'].setValue(res.username);
      entityForm.formGroup.controls['period'].setValue(res.period);
    })
    entityForm.submitFunction = this.submitFunction;

    entityForm.formGroup.controls['provider'].valueChanges.subscribe((res) => {;
       if (res === 'custom') {
        this.hideField('custom_ddns_server', false, entityForm);
        this.hideField('custom_ddns_path', false, entityForm);
       } else {
        this.hideField('custom_ddns_server', true, entityForm);
        this.hideField('custom_ddns_path', true, entityForm);
       }
    });
   }

  clean(value) {
    delete value['password2'];

    return value;
  }

  submitFunction(this: any, entityForm: any,) {
    if(entityForm.domain.length === 0) {
      entityForm.domain = [];
    }
    if(typeof entityForm.domain === "string") {
      entityForm.domain = entityForm.domain.split(/[\s,\t|{}()\[\]"']+/);
    }
    return this.ws.call('dyndns.update', [entityForm]);

  }

  preInit(entityForm) {
    this.provider = _.find(this.fieldConfig, {"name": "provider"});
    this.ws.call("dyndns.provider_choices").subscribe(res => {
      for (const key in res) {
        this.provider.options.push({label: res[key], value:key});
      }
      this.provider.options.push({label: "Custom Provider", value: 'custom'});
    });
  }

  hideField(fieldName: any, show: boolean, entity: any) {
    let target = _.find(this.fieldConfig, {'name' : fieldName});
    target['isHidden'] = show;
    entity.setDisabled(fieldName, show, show);
  }
  
}
