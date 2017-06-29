import {Component, Input} from '@angular/core';
import {Router, RouterModule, Routes} from '@angular/router';
import {Subscription} from 'rxjs';

import {RestService, WebSocketService} from '../../../services/';

@Component({
  selector : 'service',
  styleUrls : [ './service.component.scss' ],
  template : `
  <ba-card class=" col-xlg-4 col-xl-4 col-lg-6 col-sm-12 col-xs-12" title="{{status.label}} is {{status.state}}">
    <div [ngBusy]="busy" class="row">
      <div class="col-md-12">
	<span [ngClass]="status.state == 'RUNNING' ? 'state-label-running' : 'state-label-stopped'" class="v-center">
	</span>
      </div>
      <div class="col-md-4">
        <ba-checkbox [(ngModel)]="status.enable" (change)="enableToggle($event)" [label]="'Start on Boot'" [baCheckboxClass]="'v-center'"></ba-checkbox>
      </div>

      <div class="col-md-4">
        <button class="btn btn-outline-warning" (click)="editService(this.status.service)">
          <i class="ion-wrench"></i>
          <span>Edit</span>
        </button>
      </div>
      <div class="col-md-4">
        <a [ngClass]="status.state == 'RUNNING' ? 'btn btn-danger btn-fab' : 'btn btn-success btn-fab'" (click)="toggle()">
          <i [ngClass]="status.state == 'RUNNING' ? 'ion-stop' : 'ion-power'"></i>
        </a>
      </div>
    </div>
  </ba-card>
  `,
})
export class Service {

  @Input('status') status: any;

  public busy: Subscription;

  constructor(protected router: Router, private rest: RestService,
              private ws: WebSocketService) {}

  toggle() {

    let rpc: string;
    if (this.status.state != 'RUNNING') {
      rpc = 'service.start';
    } else {
      rpc = 'service.stop';
    }

    this.busy = this.ws.call(rpc, [ this.status.service ]).subscribe((res) => {
      if (res) {
        this.status.state = 'RUNNING';
      } else {
        this.status.state = 'STOPPED';
      }
    });
  }

  enableToggle($event: any) {

    this.busy = this.ws
                    .call('service.update',
                          [ this.status.id, {enable : this.status.enable} ])
                    .subscribe((res) => {
                      if (!res) {
                        this.status.enable = !this.status.enable;
                      }
                    });
  }

  editService(service: any) {
    if (service == 'iscsitarget') {
      // iscsi target global config route
      let route = [ 'sharing', 'iscsi' ];
      this.router.navigate(new Array('/pages').concat(route));
    } else {
      // Determines the route path
      this.router.navigate(new Array('/pages').concat([ 'services', service ]));
    }
  }
}
