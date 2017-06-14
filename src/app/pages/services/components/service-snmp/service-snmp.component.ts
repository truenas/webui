import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService, IscsiService, IdmapService } from '../../../../services/';
import { FormGroup, FormArray, Validators, AbstractControl} from '@angular/forms';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';


import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';

@Component ({
    selector: 'snmp-edit',
    template: ` <entity-form [conf]="this"></entity-form>`,
    providers: [IscsiService, IdmapService],
})

export class ServiceSNMPComponent {
  protected resource_name: string = 'services/snmp';
  protected route_success: string[] = ['services','snmp'];
  private entityEdit: EntityConfigComponent;
  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'snmp_location',
      placeholder: 'Location',
      label: 'Location',
      validation: [
        Validators.required
      ]
    },
    {
      type: 'input',
      name: 'snmp_contact',
      placeholder: 'Contact',
    },
    {
      type: 'input',
      name: 'snmp_community',
      placeholder: 'Community',
    },
    {
      type: 'checkbox',
      name: 'snmp_traps',
      placeholder: 'SNMP v3 Support',
    },
    {
      type: 'input',
      name: 'snmp_v3_username',
      placeholder: 'Username',
    },
    {
      type: 'select',
      name: 'snmp_v3_authtype',
      label: 'Authentic Type',
      options: [
        { label: '---', value: null },
        { label: 'MD5', value: 'MD5' },
        { label: 'SHA', value: 'SHA' }
      ]
    },
    {
      type: 'input',
      name: 'snmp_v3_password',
      inputType: 'password',
      placeholder: 'password',
      validation: [
        Validators.minLength(8),
        matchOtherValidator('snmp_v3_password_2')
      ]
    },
    {
      type: 'input',
      name: 'snmp_v3_password_2',
      inputType: 'password',
      placeholder: 'Confirm password',

    },
    {
      type: 'select',
      name: 'snmp_v3_privproto',
      label: 'Privacy Protocol',
      options: [
        { label: '---', value: null },
        { label: 'AES', value: 'AES' },
        { label: 'DES', value: 'DES' },
      ]
    },
    {
      type: 'input',
      name: 'snmp_v3_privpassphrase',
      inputType: 'password',
      placeholder: 'Privacy Passphrase'
    },
    {
      type: 'input',
      name: 'snmp_v3_privpassphrase_2',
      inputType: 'password',
      placeholder: 'Confirm Privacy Passphrase',
      validation: [
      ]
    },
    {
      type: 'textarea',
      name: 'snmp_options',
      placeholder: 'Auxiliary Parameters'
    },
  ];

  ngOnInit() {
  }

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState, protected iscsiService: IscsiService, protected idmapService: IdmapService) {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}