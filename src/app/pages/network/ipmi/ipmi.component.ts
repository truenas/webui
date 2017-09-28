import {ApplicationRef, Component, Injector, OnInit, Input} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {
  RestService,
  TooltipsService,
  WebSocketService,
  NetworkService
} from '../../../services/';
import {
  FormGroup,
} from '@angular/forms';
import {EntityFormComponent} from '../../common/entity/entity-form';
import {
  matchOtherValidator
} from '../../common/entity/entity-form/validators/password-validation';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import {Tooltip} from '../../common/tooltip';
import {TOOLTIPS} from '../../common/tooltips';
import {EntityUtils} from '../../common/entity/utils';

@Component({
  selector : 'app-ipmi',
  template : `
  <entity-form [conf]="this"></entity-form>
  `,
  providers : [ TooltipsService ],
})
export class IPMIComponent {
  @Input('conf') conf: any;

  protected resource_name: string = '';
  public formGroup: FormGroup;
  protected route_success: string[] = ['network', 'ipmi'];
  public busy: Subscription;
  public fieldConfig: FieldConfig[] = [
    {
      type: 'select',
      name: 'channel',
      placeholder: 'Channel',
      options: [],
    },
    {
      type : 'input',
      inputType: 'password',
      name : 'password',
      placeholder : 'Password',
    },
    {
      type : 'input',
      name : 'conf_password',
      inputType: 'password',
      placeholder : 'Password Conformation',
      validation : [ matchOtherValidator('password') ]
    },
    {
      type : 'checkbox',
      name : 'dhcp',
      placeholder : 'DHCP',
    },
    {
      type : 'input',
      name : 'ipaddress',
      placeholder : 'IPv4 Address',
    },
    {
      type : 'input',
      name : 'netmask',
      placeholder : 'IPv4 Netmask',
    },
    {
      type : 'input',
      name : 'gateway',
      placeholder : 'IPv4 Default Gateway',
    },
    {
      type : 'input',
      name : 'vlan',
      placeholder : 'VLAN ID',
      inputType: 'number',
    },
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected tooltipsService: TooltipsService,
              protected networkService: NetworkService
            ) {}

  protected channel: any;
  protected netmask: any;
  protected ipaddress: any;

  preInit(entityEdit: any) {
    entityEdit.isNew = true;
    this.ws.call('ipmi.query', []).subscribe((res) => {
      this.channel = _.find(this.fieldConfig, {name:'channel'});
      let netmask = [];
      for (let i = 0; i < res.length; i++) {
        this.channel.options.push({label: res[i].channel, value: res[i].channel})
      }
    });
  }

  afterInit(entityEdit: any) {
    entityEdit.submitFunction = this.submitFunction;
    
    this.ws.call('ipmi.query', []).subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        entityEdit.formGroup.controls['netmask'].setValue(res[i].netmask)
        entityEdit.formGroup.controls['channel'].setValue(res[i].channel)
        entityEdit.formGroup.controls['dhcp'].setValue(res[i].dhcp)
        entityEdit.formGroup.controls['ipaddress'].setValue(res[i].ipaddress)
        entityEdit.formGroup.controls['gateway'].setValue(res[i].gateway)
        entityEdit.formGroup.controls['vlan'].setValue(res[i].vlan)
      }
    });

    
    }
    submitFunction({}){
      const payload = {}
      const formvalue = _.cloneDeep(this.formGroup.value);
      payload['password'] = formvalue.password;
      payload['dhcp'] = formvalue.dhcp;
      payload['gateway'] = formvalue.gateway;
      payload['ipaddress'] = formvalue.ipaddress;
      payload['netmask'] = formvalue.netmask;
      payload['vlan'] = formvalue.vlan;
      return this.ws.call('ipmi.update', [ formvalue.channel, payload ]);
      
    }
}
