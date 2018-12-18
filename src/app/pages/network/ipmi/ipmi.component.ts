import { ApplicationRef, Component, Injector, Input, ViewChild, ElementRef} from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import {  DialogService, RestService, TooltipsService, WebSocketService, NetworkService } from '../../../services/';
import { FormGroup } from '@angular/forms';

import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../helptext/network/ipmi/ipmi';


@Component({
  selector : 'app-ipmi',
  template : `
  <mat-card>
  <mat-select #selectedChannel name="channel" placeholder="Channel" (change)="switchChannel()" [(ngModel)]="selectedValue">
    <mat-option *ngFor="let channel of channels" [value]="channel.value">
      Channel {{channel.value}}
    </mat-option>
  </mat-select>
  </mat-card>
  <entity-form [conf]="this"></entity-form>
  `,
  providers : [ TooltipsService ],
})
export class IPMIComponent {
  @Input('conf') conf: any;
  @ViewChild('selectedChannel') select: ElementRef;
  selectedValue: string;

  protected resource_name = '';
  public formGroup: FormGroup;
  public busy: Subscription;
  public channels = [];
  protected channel: any;
  protected netmask: any;
  protected ipaddress: any;
  protected entityEdit: any;
  private options: Array<any> = [
    {label:'Indefinitely', value: 'force'},
    {label:'15 seconds', value: 15},
    {label:'30 seconds', value: 30},
    {label:'1 minute', value: 60},
    {label:'2 minute', value: 120},
    {label:'3 minute', value: 180},
    {label:'4 minute', value: 240},
    {label:'Turn OFF', value: 0}
  ]
  public custActions: Array<any> = [
    {
      'id' : 'ipmi_identify',
      'name' : 'Identify Light',
       function :  () => {
        this.dialog.select(
          'IPMI Identify',this.options,'IPMI flash duration','ipmi.identify','seconds', "IPMI identify command issued");
      }
    }
  ];
  public fieldConfig: FieldConfig[] = [

    {
      type : 'input',
      inputType: 'password',
      name : 'password',
      placeholder : helptext.password_placeholder,
      validation: helptext.password_validation,
      hasErrors: false,
      errors: helptext.password_errors,
      togglePw: true,
      tooltip : helptext.password_tooltip,

    },
    {
      type : 'input',
      name : 'conf_password',
      inputType: 'password',
      placeholder : helptext.conf_password_placeholder,
      validation : helptext.conf_password_validation
    },
    {
      type : 'checkbox',
      name : 'dhcp',
      placeholder : helptext.dhcp_placeholder,
      tooltip : helptext.dhcp_tooltip,
    },
    {
      type : 'input',
      name : 'ipaddress',
      placeholder : helptext.ipaddress_placeholder,
      tooltip : helptext.ipaddress_tooltip,
    },
    {
      type : 'input',
      name : 'netmask',
      placeholder : helptext.netmask_placeholder,
      tooltip : helptext.netmask_tooltip,
    },
    {
      type : 'input',
      name : 'gateway',
      placeholder : helptext.gateway_placeholder,
      tooltip : helptext.gateway_tooltip,
    },
    {
      type : 'input',
      name : 'vlan',
      placeholder : helptext.vlan_placeholder,
      tooltip : helptext.vlan_tooltip,
      inputType: 'number',
    },
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected tooltipsService: TooltipsService,
              protected networkService: NetworkService, protected dialog: DialogService
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

    entityEdit.formGroup.controls['password'].statusChanges.subscribe((res) => {
      res === 'INVALID' ? _.find(this.fieldConfig)['hasErrors'] = true : _.find(this.fieldConfig)['hasErrors'] = false;
    })
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
          this.selectedValue = res[i].channel;
          this.entityEdit.formGroup.controls['netmask'].setValue(res[i].netmask);
          this.entityEdit.formGroup.controls['dhcp'].setValue(res[i].dhcp);
          this.entityEdit.formGroup.controls['ipaddress'].setValue(res[i].ipaddress);
          this.entityEdit.formGroup.controls['gateway'].setValue(res[i].gateway);
          this.entityEdit.formGroup.controls['vlan'].setValue(res[i].vlan);
        }
      });
    }

}
