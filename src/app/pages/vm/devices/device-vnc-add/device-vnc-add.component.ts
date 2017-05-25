import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'app-device-vnc-add',
  template: `<device-add [conf]="this"></device-add>`
})
export class DeviceVncAddComponent {

  protected resource_name: string = 'vm/device';
  protected pk: any;
  protected route_success: string[];
  protected vm: string;
  protected formModel: DynamicFormControlModel[] = [
        new DynamicInputModel({
          id: 'VNC_port',
          label: 'port',
          inputType: 'number',
          min: '0',
          max: ' 65535'
          }),
       new DynamicCheckboxModel({
          id: 'VNC_wait',
          label: 'wait on boot',
        }),
      new DynamicSelectModel({
          id: 'VNC_resolution',
          label: 'Resolution:',
          options: [
            { label: '1920x1080', value: "1920x1080" },
            { label: '1400x1050', value: "1400x1050" },
            { label: '1280x1024', value: "1280x1024" },
            { label: '1280x960', value: "1280x960" },
            { label:'1024x768', value:'1024x768' },
            { label:'800x600', value: '800x600'},
            { label: '640x480', value:'640x480'},
            ],
          }),
       ];
  protected dtype: string = 'VNC';
  afterInit() {
    this.route.params.subscribe(params => {
        this.pk = params['pk'];
        this.vm = params['name'];
        this.route_success = ['vm', this.pk, 'devices', this.vm];
    });
  }
  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

}
