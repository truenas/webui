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

import {RestService, WebSocketService} from '../../../../services/';
import {VmService} from '../../../../services/vm.service';
import {EntityUtils} from '../../../common/entity/utils';

@Component({
  selector : 'app-device-disk-add',
  template : `<device-add [conf]="this"></device-add>`,
  providers : [ VmService ]
})
export class DeviceDiskAddComponent {

  public resource_name = 'vm/device';
  public pk: any;
  public vm: string;
  public route_success: string[];
  public dtype = 'DISK';
  private DISK_zvol: any;
  public fieldConfig: FieldConfig[] = [
    {
      name : 'DISK_zvol',
      placeholder : 'ZVol',
      tooltip : 'After <a\
    href="http://doc.freenas.org/11/storage.html#create-zvol"\
    target="_blank">creating a zvol</a>, select it from the list.',
      type: 'explorer',
      explorerType: "zvol",
      initial: '/mnt',
    },
    {
      name : 'DISK_mode',
      placeholder : 'Mode',
      tooltip : '<i>AHCI</i> emulates an AHCI hard disk for best\
 software compatibility. <i>VirtIO</i> uses paravirtualized drivers and\
 can provide better performance, but requires the operating system\
 installed in the VM to support VirtIO disk devices.',
      type: 'select',
      options : [
        {label : 'AHCI', value : 'AHCI'},
        {label : 'VirtIO', value : 'VIRTIO'},
      ],
    },
    {
      name : 'sectorsize',
      placeholder : 'Disk sectorsize',
      tooltip : 'If a specific sector size is required, enter the\
 number of bytes. The default of <i>0</i> leaves the sector size unset.',
      type: 'input',
      value: 0
    },
  ];

  afterInit(entityAdd: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.vm = params['name'];
      this.route_success = [ 'vm', this.pk, 'devices', this.vm ];
    });
  }

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      public vmService: VmService,
  ) {}
}
