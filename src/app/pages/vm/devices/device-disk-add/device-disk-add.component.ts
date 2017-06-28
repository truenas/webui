import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute} from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { VmService } from '../../../../services/vm.service';

@Component({
  selector: 'app-device-disk-add',
  template: `<device-add [conf]="this"></device-add>`,
  providers: [VmService]
})
export class DeviceDiskAddComponent {

  protected resource_name: string = 'vm/device';
  protected pk: any;
  public vm: string;
  protected route_success: string[];
  protected dtype: string = 'DISK';
  private DISK_zvol: DynamicSelectModel<string>;
  public formModel: DynamicFormControlModel[] = [
        new DynamicSelectModel({
          id: 'DISK_zvol',
          label: 'ZVol',
          }),
        new DynamicSelectModel({
          id: 'DISK_mode',
          label: 'Mode',
          options: [
            { label:'AHCI', value: 'AHCI'},
            { label: 'VirtIO',  value: 'VIRTIO'},
          ],
        }),
      ];

  afterInit(deviceAdd: any) {
    this.route.params.subscribe(params => {
        this.pk = params['pk'];
        this.vm = params['name'];
        this.route_success = ['vm', this.pk, 'devices', this.vm];
    });
    this.vmService.getStorageVolumes().subscribe((res) => {
      let data = new EntityUtils().flattenData(res.data);
      this.DISK_zvol = <DynamicSelectModel<string>>this.formService.findById("DISK_zvol", this.formModel);
      for (let dataset of data){
        if (dataset.type === 'zvol') {
          this.DISK_zvol.add({ label: dataset.name, value: dataset.path });
        };
      };
    });
  }

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState, public vmService: VmService,) {

  }

}
