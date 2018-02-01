import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';
import {WebSocketService} from '../../../../services/ws.service';
import {AppLoaderService} from '../../../../services/app-loader/app-loader.service';

@Component({
  selector : 'app-vm-device-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class DeviceDeleteComponent {

  protected resource_name: string = 'vm/device';
  protected route_success: string[];
  public vmid: any;
  public vm: string;
  protected skipGet: boolean = true;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected loader: AppLoaderService ) {}

  afterInit(entityDelete: any) {
    this.route.params.subscribe(params => {
      this.vmid = params['vmid'];
      this.vm = params['name'];
      this.route_success = [ 'vm', this.vmid, 'devices', this.vm ];
    });
  }
  customSubmit(entityDelete: any){
    this.ws.call('datastore.delete', ['vm.device', entityDelete.pk]).subscribe(
      (res)=>{
        this.loader.close();
        this.router.navigate(new Array('').concat(this.route_success));
    });
  }
}
