import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';


import {RestService, WebSocketService} from '../../../../services/';

@Component({
  selector : 'app-device-cdrom-add',
  template : `<device-add [conf]="this"></device-add>`
})

export class DeviceCdromAddComponent {

  protected resource_name: string = 'vm/device';
  protected pk: any;
  protected route_success: string[];
  public vm: string;
  public fieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      name : 'path',
      placeholder : 'CDROM Path',
      tooltip : 'Select the path to the CDROM. The image must be\
 present on an accessible portion of the FreeNAS storage.',
      validation : [ Validators.required ]
    },
    
  ];
  protected dtype: string = 'CDROM';

  afterInit() {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.vm = params['name'];
      this.route_success = [ 'vm', this.pk, 'devices', this.vm ];
    });
  }

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
            ) {}
}
