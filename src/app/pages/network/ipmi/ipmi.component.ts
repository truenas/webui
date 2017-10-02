import {ApplicationRef, Component, Injector, OnInit, Input, ViewChild, ElementRef} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import { MaterialModule, MdTableModule } from '@angular/material';

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
  <md-card>
  <md-select #selectedChannel name="channel" placeholder="Channel" (change)="switchChannel()" [(ngModel)]="selectedValue">
    <md-option *ngFor="let channel of channels" [value]="channel.value">
      Channel {{channel.value}}
    </md-option>
  </md-select>
  </md-card>
  <entity-form [conf]="this"></entity-form>
  `,
  providers : [ TooltipsService ],
})
export class IPMIComponent {
  @Input('conf') conf: any;
  @ViewChild('selectedChannel') select: ElementRef;
  selectedValue: string

  protected resource_name: string = '';
  public formGroup: FormGroup;
  protected route_success: string[] = ['network', 'ipmi'];
  public busy: Subscription;
  public channels = [];
  protected channel: any;
  protected netmask: any;
  protected ipaddress: any;
  protected entityEdit: any;
  public fieldConfig: FieldConfig[] = [

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



  preInit(entityEdit: any) {

  }

  afterInit(entityEdit: any) {
    entityEdit.isNew = true;
    this.ws.call('ipmi.query', []).subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        this.channels.push({label: res[i].channel, value: res[i].channel})
      }
    });
    entityEdit.submitFunction = this.submitFunction;
    this.entityEdit = entityEdit;
    this.loadData();
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
      return this.ws.call('ipmi.update', [ this.conf.selectedValue, payload ]);
      
    }
    switchChannel(){
      const myFilter = [];
      myFilter.push("id")
      myFilter.push("=")
      myFilter.push(this.selectedValue) 
      this.loadData([[myFilter]]);
    }

    loadData(filter = []){
      this.ws.call('ipmi.query', filter).subscribe((res) => {
        for (let i = 0; i < res.length; i++) {
          this.entityEdit.formGroup.controls['netmask'].setValue(res[i].netmask);
          this.entityEdit.formGroup.controls['dhcp'].setValue(res[i].dhcp);
          this.entityEdit.formGroup.controls['ipaddress'].setValue(res[i].ipaddress);
          this.entityEdit.formGroup.controls['gateway'].setValue(res[i].gateway);
          this.entityEdit.formGroup.controls['vlan'].setValue(res[i].vlan);
        }
      });
      
    }
}
