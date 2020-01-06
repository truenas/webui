import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { IdmapService, IscsiService, RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-snmp';

@Component({
  selector : 'snmp-edit',
  template : ` <entity-form [conf]="this"></entity-form>`,
  providers : [ IscsiService, IdmapService ],
})

export class ServiceSNMPComponent {
  protected resource_name: string = 'services/snmp';
  protected addCall: string = 'snmp.update';
  protected route_success: string[] = [ 'services' ];
  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'location',
      placeholder : helptext.location_placeholder,
      tooltip: helptext.location_tooltip,
      label : helptext.location_label,
      validation : helptext.location_validation
    },
    {
      type : 'input',
      name : 'contact',
      placeholder : helptext.contact_placeholder,
      tooltip: helptext.contact_tooltip,
      validation: helptext.contact_validation
    },
    {
      type : 'input',
      name : 'community',
      placeholder : helptext.community_placeholder,
      tooltip: helptext.community_tooltip,
      validation: helptext.community_validation
    },
    {
      type : 'checkbox',
      name : 'v3',
      placeholder : helptext.v3_placeholder,
      tooltip: helptext.v3_tooltip,
    },
    {
      type : 'input',
      name : 'v3_username',
      placeholder : helptext.v3_username_placeholder,
      tooltip: helptext.v3_username_tooltip,
      relation : helptext.v3_username_relation
    },
    {
      type : 'select',
      name : 'v3_authtype',
      placeholder : helptext.v3_authtype_placeholder,
      tooltip: helptext.v3_authtype_tooltip,
      options : helptext.v3_authtype_options,
      relation : helptext.v3_authtype_relation
    },
    {
      type : 'input',
      name : 'v3_password',
      inputType : 'password',
      placeholder : helptext.v3_password_placeholder,
      togglePw: true,
      tooltip: helptext.v3_password_tooltip,
      required: true,
      validation : helptext.v3_password_validation,
      relation : helptext.v3_password_relation
    },
    {
      type : 'input',
      name : 'v3_password2',
      inputType : 'password',
      placeholder : helptext.v3_password2_placeholder,
      required: true,
      validation: helptext.v3_password2_validation,
      relation : helptext.v3_password2_relation
    },
    {
      type : 'select',
      name : 'v3_privproto',
      placeholder : helptext.v3_privproto_placeholder,
      tooltip: helptext.v3_privproto_tooltip,
      options : helptext.v3_privproto_options,
      relation : helptext.v3_privproto_relation
    },
    {
      type : 'input',
      name : 'v3_privpassphrase',
      inputType : 'password',
      togglePw: true,
      placeholder : helptext.v3_privpassphrase_placeholder,
      tooltip: helptext.v3_privpassphrase_tooltip,
      validation : helptext.v3_privpassphrase_validation,
      relation : helptext.v3_privpassphrase_relation
    },
    {
      type : 'input',
      name : 'v3_privpassphrase2',
      inputType : 'password',
      placeholder : helptext.v3_privpassphrase2_placeholder,
      relation : helptext.v3_privpassphrase2_relation
    },
    {
      type : 'textarea',
      name : 'options',
      placeholder : helptext.options_placeholder,
      tooltip: helptext.options_tooltip,
    },
    {
      type : 'checkbox',
      name : 'zilstat',
      placeholder : helptext.zilstat_placeholder,
      tooltip: helptext.zilstat_tooltip,
    },
    {
      type : 'select',
      name : 'loglevel',
      placeholder : helptext.loglevel_placeholder,
      tooltip : helptext.loglevel_tooltip,
      options : helptext.loglevel_options
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected iscsiService: IscsiService,
              protected idmapService: IdmapService) {}

  afterInit(entityForm: any) {
    entityForm.ws.call('snmp.config').subscribe((res)=>{
      entityForm.formGroup.controls['location'].setValue(res.location);
      entityForm.formGroup.controls['contact'].setValue(res.contact);
      entityForm.formGroup.controls['community'].setValue(res.community);
      entityForm.formGroup.controls['v3'].setValue(res.v3);
      entityForm.formGroup.controls['v3_username'].setValue(res.v3_username);
      entityForm.formGroup.controls['v3_privproto'].setValue(res.v3_privproto);
      entityForm.formGroup.controls['options'].setValue(res.options);
      entityForm.formGroup.controls['loglevel'].setValue(res.loglevel);
      entityForm.formGroup.controls['v3_password'].setValue(res.v3_password);
      entityForm.formGroup.controls['v3_password2'].setValue(res.v3_password);
      entityForm.formGroup.controls['v3_privpassphrase'].setValue(res.v3_privpassphrase);
      entityForm.formGroup.controls['v3_privpassphrase2'].setValue(res.v3_privpassphrase);
      entityForm.formGroup.controls['v3_authtype'].setValue(res.v3_authtype);
      entityForm.formGroup.controls['zilstat'].setValue(res.zilstat);
    });
    entityForm.submitFunction = this.submitFunction;
   }

  clean(value) {
    delete value['v3_privpassphrase2'];
    delete value['v3_password2'];
    if (!value['v3']){
      value['v3_password'] = "";
      value['v3_privpassphrase'] = "";
      value['v3_privproto'] = null;
      value['v3_authtype'] = "";


    }

    return value;
  }

  submitFunction(this: any, entityForm: any,){

    return this.ws.call('snmp.update', [entityForm]);

  }
}
