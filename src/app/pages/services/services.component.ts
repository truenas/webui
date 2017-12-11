import {Component, OnInit, ViewChild} from '@angular/core';
import { Subscription } from 'rxjs';
import {MdButtonToggleGroup, MdGridListModule} from '@angular/material';

import { RestService, WebSocketService } from '../../services/';
import {Router} from "@angular/router";
import {AppConfirmService} from "../../services/app-confirm/app-confirm.service";
import {environment} from "../../../environments/environment";

@Component({
  styleUrls: ['./services.scss'],
  templateUrl: './services.html'
})
export class Services implements OnInit {

  public services: any[];
  public busy: Subscription;
  @ViewChild('viewMode') viewMode: MdButtonToggleGroup;

  public name_MAP: Object = {
    'afp': 'AFP',
    'domaincontroller': 'Domain Controller',
    'dynamicdns': 'Dynamic DNS',
    'ftp': 'FTP',
    'iscsitarget': 'iSCSI',
    'lldp': 'LLDP',
    'nfs': 'NFS',
    'rsync': 'Rsync',
    's3': 'S3',
    'smartd': 'S.M.A.R.T.',
    'snmp': 'SNMP',
    'ssh': 'SSH',
    'cifs': 'SMB',
    'tftp': 'TFTP',
    'ups': 'UPS',
    'webdav': 'WebDAV',
  }

  constructor(protected router: Router,
              private rest: RestService,
              private confirmService: AppConfirmService,
              private ws: WebSocketService) {}

  ngOnInit() {
    this.getServices();
    this.viewMode.value = localStorage.getItem('view') ? localStorage.getItem('view') : 'cards';
  }

  getServices() {
    this.busy = this.ws.call('service.query', [[], {"order_by": ["service"]}])
        .subscribe((res) => {
          this.services = res;
          this.services.forEach((item) => {
            if (this.name_MAP[item.service]) {
              item.label = this.name_MAP[item.service];
            } else {
              item.label = item.service;
            }
          });
        });
  }

  toggleService(row) {
    let rpc: string;
    rpc = row.state != 'RUNNING' ? 'service.start' : 'service.stop';
    if (rpc === 'service.stop') {
      let confirm = this.confirmService.confirm('Alert', 'Are you sure you want to stop this service?');
      confirm.subscribe(res => {
        if(res) this.updateService(row, rpc);
        else this.getServices();
      })
    } else {
      this.updateService(row, rpc);
    }
  }

  toggleAutoStart(row) {
    this.busy = this.ws .call('service.update',[row.id, {enable: row.enable}])
      .subscribe((res) => {
        this.getServices();
      });
  }

  updateService(service, rpc) {
    this.busy = this.ws.call(rpc, [service.service]).subscribe((res) => {
      this.getServices();
    });
  }


  configure(service: any) {
    if (service === 'iscsitarget') {
      // iscsi target global config route
      let route = ['sharing', 'iscsi'];
      this.router.navigate(['/', 'sharing', 'iscsi']);
    } else if (service === 'netdata') {
      window.open("http://" + environment.remote + "/netdata/#menu_system_submenu_swap;theme=slate");
    } else {
      // Determines the route path
      this.router.navigate(['/', 'services', service]);
    }
  }


  onViewChange(event) {
    localStorage.setItem('view', event.value);
  }
}
