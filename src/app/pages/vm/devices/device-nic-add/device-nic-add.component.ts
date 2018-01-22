import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';


import {RestService, WebSocketService, NetworkService} from '../../../../services/';

@Component({
  selector : 'app-device-nic-add',
  template : `<device-add [conf]="this"></device-add>`,
})
export class DeviceNicAddComponent {

  protected resource_name: string = 'vm/device';
  protected pk: any;
  protected route_success: string[];
  public vm: string;
  private nicType:  any;

  protected dtype: string = 'NIC';

  public fieldConfig: FieldConfig[]  = [
    {
      name : 'NIC_type',
      placeholder : 'Adapter Type:',
      tooltip : 'The default emulates an Intel E1000 (82545) Ethernet\
 card for compatibility with most operating systems. If the operating\
 system installed in the VM supports VirtIO paravirtualized network\
 drivers, this can be changed to <i>VirtIO</i> to provide better\
 performace.',
      type: 'select',
      options : [],
    },
    {
      name : 'NIC_mac',
      placeholder : 'Mac Address',
      tooltip : 'By default, the VM receives an auto-generated random\
 MAC address. To override the default with a custom value, enter the\
 desired address into the field.',
      type: 'input',
      value : '00:a0:98:FF:FF:FF',
    },
    {
      name : 'nic_attach',
      placeholder : 'Nic to attach:',
      tooltip : 'Can be used to specify which physical interface to\
 associate with the VM if the system has multiple physical network\
 cards.',
      type: 'select',
      options : [],
    },
  ];
  private nic_attach: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected networkService: NetworkService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityAdd: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.vm = params['name'];
      this.route_success = [ 'vm', this.pk, 'devices', this.vm ];
    });
    this.networkService.getAllNicChoices().subscribe((res) => {
      this.nic_attach = _.find(this.fieldConfig, {'name' : 'nic_attach'});
      res.forEach((item) => {
        this.nic_attach.options.push({label : item[1], value : item[0]});
      });
    });
    entityAdd.ws.call('notifier.choices', [ 'VM_NICTYPES' ])
        .subscribe((res) => {
          this.nicType = _.find(this.fieldConfig, {name : "NIC_type"});
          res.forEach((item) => {
            this.nicType.options.push({label : item[1], value : item[0]});
          });
        });
  }
}
