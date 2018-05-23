import {ApplicationRef, Component, Injector, OnInit, Input, ViewChild, ElementRef} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs/Subscription';
import { MaterialModule } from '../../../appMaterial.module';
import {  DialogService } from '../../../services/';

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
import { T } from '../../../translate-marker';

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
      placeholder : T('Password'),
      tooltip : T('Enter the password used to connect to the IPMI\
                   interface from a web browser.'),

    },
    {
      type : 'input',
      name : 'conf_password',
      inputType: 'password',
      placeholder : T('Confirm Password'),
      validation : [ matchOtherValidator('password') ]
    },
    {
      type : 'checkbox',
      name : 'dhcp',
      placeholder : T('DHCP'),
      tooltip : T('Unset to manually configure <b>IPv4</b>.'),
    },
    {
      type : 'input',
      name : 'ipaddress',
      placeholder : T('IPv4 Address'),
      tooltip : T('Enter the IP address used to connect to the IPMI web\
                   interface'),
    },
    {
      type : 'input',
      name : 'netmask',
      placeholder : T('IPv4 Netmask'),
      tooltip : T('Choose the subnet mask associated with the IP address.'),
    },
    {
      type : 'input',
      name : 'gateway',
      placeholder : T('IPv4 Default Gateway'),
      tooltip : T('Enter the default gateway associated with the IP\
                   address.'),
    },
    {
      type : 'input',
      name : 'vlan',
      placeholder : T('VLAN ID'),
      tooltip : T('Enter the VLAN identifier if the IPMI out-of-band\
                   management interface is not on the same VLAN as\
                   management networking.'),
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
