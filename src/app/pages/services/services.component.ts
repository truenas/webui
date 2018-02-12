import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatGridListModule } from '@angular/material';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AppConfirmService } from "../../services/app-confirm/app-confirm.service";
import { MatSlideToggleChange, MatSlideToggle } from "@angular/material";

import { RestService, WebSocketService } from '../../services/';

@Component({
  selector: 'services',
  styleUrls: [ './services.component.css'],
  templateUrl: './services.component.html'
})
export class Services implements OnInit {

  @ViewChild('filter') filter: ElementRef;
  @Input() searchTerm: string = '';
  @Input() cards = []; // Display List
  @ViewChild('viewMode') viewMode: MatButtonToggleGroup;
  @ViewChild('serviceStatus') serviceStatus: MatSlideToggle;
  focusedVM: string;

  public services: any[];
  public busy: Subscription;

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

  public cache = [];

  constructor(protected rest: RestService, protected ws: WebSocketService, protected router: Router,
    private confirmService: AppConfirmService) {}

  parseResponse(data) {
    const card = {
      id: data.id,
      label: data.label,
      title: data.service,
      enable: data.enable,
      state: data.state,
      lazyLoaded: false,
      template: 'none',
      isNew: false
    }
    return card;
  }

  ngOnInit() {
    this.viewMode.value = "cards";

    this.busy =
      this.ws.call('service.query', [
        [], { "order_by": ["service"] }
      ])
      .subscribe((res) => {
        this.services = res;
        this.services.forEach((item) => {
          if (this.name_MAP[item.service]) {
            item.label = this.name_MAP[item.service];
          } else {
            item.label = item.service;
          }
          const card = this.parseResponse(item);
          this.cards.push(card);
          this.cache.push(card);
        })
      });
  }

  displayFilter(key, query ? ) {
    if (query == '' || !query) {
      this.displayAll();
    } else {
      this.cards = this.cache.filter((card) => {
        var result = card[key].toLowerCase().indexOf(query.toLowerCase()) > -1;
        return result;
      });
    }
  }

  displayAll() {
    this.cards = this.cache;
  }

  cardStyles() {
    let cardStyles = {
      'width': this.viewMode.value == 'slim' ? '285px' : '380px',
      'height': '250px',
      'margin': '25px auto'
    }
    return cardStyles;
  }

  toggle(service: any) {
    let rpc: string;
    if (service.state != 'RUNNING') {
      rpc = 'service.start';
    } else {
      rpc = 'service.stop';
    }

    if (rpc === 'service.stop') {
      let confirm = this.confirmService.confirm('Alert', 'Are you sure you want to stop this service?');
      confirm.subscribe(res => {
        if (res) {
          this.updateService(rpc, service);
        }
      })
    } else {
      this.updateService(rpc, service);
    }
  }

  updateService(rpc, service) {
    this.busy = this.ws.call(rpc, [service.title]).subscribe((res) => {
      if (res) {
        service.state = 'RUNNING';
      } else {
        service.state = 'STOPPED';
      }
    });
  }

  enableToggle($event: any, service: any) {
    this.busy = this.ws
      .call('service.update', [service.id, { enable: service.enable }])
      .subscribe((res) => {
        if (!res) {
          service.enable = !service.enable;
        }
      });
  }

  editService(service: any) {
    if (service === 'iscsitarget') {
      // iscsi target global config route
      let route = ['sharing', 'iscsi'];
      this.router.navigate(new Array('').concat(route));
    } else if (service === 'netdata') {
      window.open("http://" + environment.remote + "/netdata/#menu_system_submenu_swap;theme=slate");
    } else if (service === 'cifs') {
      this.router.navigate(new Array('').concat(['services', 'smb']));
    } else {
      // Determines the route path
      this.router.navigate(new Array('').concat(['services', service]));
    }
  }
}
