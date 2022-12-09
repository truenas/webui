import {
  ApplicationRef, Component, Injector, Input, ViewChild, ElementRef,
} from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import {
  DialogService, RestService, TooltipsService, WebSocketService,
  NetworkService, SnackbarService,
} from '../../../services';
import { FormGroup } from '@angular/forms';
import { regexValidator } from '../../common/entity/entity-form/validators/regex-validation';
import { ipv4Validator } from '../../common/entity/entity-form/validators/ip-validation';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../helptext/network/ipmi/ipmi';
import globalHelptext from '../../../helptext/global-helptext';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../common/entity/utils';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { T } from '../../../translate-marker';

@Component({
  selector: 'app-ipmi',
  template: `
  <mat-card class="ipmi-card">
  <mat-spinner
    diameter='25'
    class="form-select-spinner"
    id="ipmi_controller-spinner"
    *ngIf="!currentControllerLabel && is_ha">
  </mat-spinner>
  <mat-select *ngIf="is_ha" #storageController name="controller" placeholder="Controller" (selectionChange)="loadData()" [(ngModel)]="remoteController" [style.margin-top.px]="15">

    <mat-option [value]="false">Active: {{controllerName}} {{currentControllerLabel}}</mat-option>
    <mat-option [value]="true">Standby: {{controllerName}} {{failoverControllerLabel}}</mat-option>
  </mat-select><br/>
  <mat-select #selectedChannel name="channel" placeholder="Channel" (selectionChange)="switchChannel()" [(ngModel)]="selectedValue">
    <mat-option *ngFor="let channel of channels" [value]="channel.value">
      Channel {{channel.value}}
    </mat-option>
  </mat-select>
  </mat-card>
  <entity-form [conf]="this"></entity-form>
  `,
  styleUrls: ['./ipmi.component.css'],
  providers: [TooltipsService, SnackbarService],
})
export class IPMIComponent {
  @ViewChild('selectedChannel', { static: true }) select: ElementRef;
  selectedValue: string;

  protected resource_name = '';
  formGroup: FormGroup;
  busy: Subscription;
  channels = [];
  protected channel: any;
  protected netmask: any;
  protected ipaddress: any;
  protected entityEdit: any;
  remoteController = false;
  is_ha = false;
  controllerName = globalHelptext.Ctrlr;
  currentControllerLabel: string;
  failoverControllerLabel: string;
  managementIP: string;
  private options: any[] = [
    { label: 'Indefinitely', value: 'force' },
    { label: '15 seconds', value: 15 },
    { label: '30 seconds', value: 30 },
    { label: '1 minute', value: 60 },
    { label: '2 minute', value: 120 },
    { label: '3 minute', value: 180 },
    { label: '4 minute', value: 240 },
    { label: 'Turn OFF', value: 0 },
  ];
  custActions: any[] = [
    {
      id: 'ipmi_identify',
      name: T('Identify Light'),
      function: () => {
        this.dialog.select(
          'IPMI Identify', this.options, 'IPMI flash duration', 'ipmi.identify', 'seconds', 'IPMI identify command issued',
        );
      },
    },
    {
      id: 'connect',
      name: T('Manage'),
      function: () => {
        window.open(`http://${this.managementIP}`);
      },
    },
  ];
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.ipmi_configuration,
      width: '100%',
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'dhcp',
          placeholder: helptext.dhcp_placeholder,
          tooltip: helptext.dhcp_tooltip,
        },
        {
          type: 'input',
          name: 'ipaddress',
          placeholder: helptext.ipaddress_placeholder,
          tooltip: helptext.ipaddress_tooltip,
          validation: [ipv4Validator('ipaddress')],
          errors: helptext.ip_error,
          hasErrors: false,
          relation: [
            {
              action: 'DISABLE',
              when: [{
                name: 'dhcp',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'netmask',
          placeholder: helptext.netmask_placeholder,
          tooltip: helptext.netmask_tooltip,
          validation: [ipv4Validator('netmask')],
          errors: helptext.ip_error,
          hasErrors: false,
          relation: [
            {
              action: 'DISABLE',
              when: [{
                name: 'dhcp',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'gateway',
          placeholder: helptext.gateway_placeholder,
          tooltip: helptext.gateway_tooltip,
          validation: [ipv4Validator('gateway')],
          errors: helptext.ip_error,
          hasErrors: false,
          relation: [
            {
              action: 'DISABLE',
              when: [{
                name: 'dhcp',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'vlan',
          placeholder: helptext.vlan_placeholder,
          tooltip: helptext.vlan_tooltip,
          inputType: 'number',
        },
      ],
    },
    {
      name: 'ipmi_divider',
      divider: true,
    },
    {
      name: helptext.ipmi_password_reset,
      width: '100%',
      label: true,
      config: [
        {
          type: 'input',
          inputType: 'password',
          name: 'password',
          placeholder: helptext.password_placeholder,
          validation: helptext.password_validation,
          hasErrors: false,
          errors: helptext.password_errors,
          togglePw: true,
          tooltip: helptext.password_tooltip,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    }];

  constructor(protected router: Router, protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected tooltipsService: TooltipsService,
    protected networkService: NetworkService, protected dialog: DialogService,
    protected loader: AppLoaderService, protected snackBar: SnackbarService) {}

  preInit(entityEdit: any) {
    if (window.localStorage.getItem('product_type') === 'ENTERPRISE') {
      this.ws.call('failover.licensed').subscribe((is_ha) => {
        this.is_ha = is_ha;
        if (this.is_ha) {
          this.ws.call('failover.node').subscribe((node) => {
            this.currentControllerLabel = (node === 'A') ? '1' : '2';
            this.failoverControllerLabel = (node === 'A') ? '2' : '1';
          });
        }
      });
    }
  }

  afterInit(entityEdit: any) {
    entityEdit.isNew = true;
    this.ws.call('ipmi.query', []).subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        this.channels.push({ label: res[i].channel, value: res[i].channel });
      }
    });
    this.entityEdit = entityEdit;
    this.loadData();

    entityEdit.formGroup.controls['password'].statusChanges.subscribe((status) => {
      this.setErrorStatus(status, _.find(this.fieldConfig, { name: 'password' }));
    });

    entityEdit.formGroup.controls['ipaddress'].statusChanges.subscribe((status) => {
      this.setErrorStatus(status, _.find(this.fieldConfig, { name: 'ipaddress' }));
      const ipValue = entityEdit.formGroup.controls['ipaddress'].value;
      const btn = <HTMLInputElement> document.getElementById('cust_button_Manage');
      status === 'INVALID' || ipValue === '0.0.0.0' ? btn.disabled = true : btn.disabled = false;
    });

    entityEdit.formGroup.controls['ipaddress'].valueChanges.subscribe((value) => {
      this.managementIP = value;
    });

    entityEdit.formGroup.controls['netmask'].statusChanges.subscribe((status) => {
      this.setErrorStatus(status, _.find(this.fieldConfig, { name: 'netmask' }));
    });

    entityEdit.formGroup.controls['gateway'].statusChanges.subscribe((status) => {
      this.setErrorStatus(status, _.find(this.fieldConfig, { name: 'gateway' }));
    });
  }

  setErrorStatus(status, field) {
    status === 'INVALID' ? field.hasErrors = true : field.hasErrors = false;
  }

  customSubmit(payload) {
    payload.vlan = payload.vlan ? parseInt(payload.vlan) : null;
    let call = this.ws.call('ipmi.update', [this.selectedValue, payload]);
    if (this.remoteController) {
      call = this.ws.call('failover.call_remote', ['ipmi.update', [this.selectedValue, payload]]);
    }

    this.loader.open();
    return call.subscribe((res) => {
      this.loader.close();
      this.dialog.report(T('Settings saved.'), '', '300px', 'info', true);
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityEdit, res);
    });
  }

  switchChannel() {
    const myFilter = [];
    myFilter.push('id');
    myFilter.push('=');
    myFilter.push(this.selectedValue);
    this.loadData([[myFilter]]);
  }

  loadData(filter = []) {
    let query = this.ws.call('ipmi.query', filter);
    if (this.remoteController) {
      query = this.ws.call('failover.call_remote', ['ipmi.query', [filter]]);
    }
    query.subscribe((res) => {
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
