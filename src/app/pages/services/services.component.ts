import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatButtonToggleGroup }  from '@angular/material/button-toggle';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { RestService, WebSocketService, IscsiService, SystemGeneralService} from '../../services/';
import { DialogService } from '../../services/dialog.service';

import * as _ from 'lodash';
import { T } from '../../translate-marker';


@Component({
  selector: 'services',
  styleUrls: [ './services.component.css'],
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [IscsiService]
})
export class Services implements OnInit {
  public title = "Services";
  public isFooterConsoleOpen: boolean;
  private getAdvancedConfig: Subscription;
  protected queryCall = 'service.query';
  protected queryCallOption = [[], { "order_by": ["service"] }];
  protected rowIdentifier = 'name';
  protected inlineActions = true;
  
  public columns: Array<any> = [
    { name: 'Name', prop: 'name', always_display: true },
    { name: 'Running', prop: 'state', toggle: true, always_display: true },
    { name: 'Start Automatically', prop: 'enable', checkbox: true, always_display: true },
  ];
  
  public config: any = {
    paging: false,
    sorting: { columns: this.columns },
  };
  public services: any[];
  public busy: Subscription;

  public name_MAP: Object = {
    'afp': 'AFP',
    'dynamicdns': 'Dynamic DNS',
    'ftp': 'FTP',
    'glusterd': 'Gluster',
    'iscsitarget': 'iSCSI',
    'lldp': 'LLDP',
    'nfs': 'NFS',
    'openvpn_client': 'OpenVPN Client',
    'openvpn_server': 'OpenVPN Server',
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

  public showSpinner: boolean = true;

  constructor(protected rest: RestService, protected ws: WebSocketService, protected router: Router,
    private dialog: DialogService, private iscsiService: IscsiService, private sysGeneralService: SystemGeneralService) {}
  
  resourceTransformIncomingRestData(data) {
    let hidden = ['netdata'];
    
    return data.map((item) => {
      item.title = item.service;
      if (!hidden.includes(item.service)) {
        if (this.name_MAP[item.service]) {
          item.name = this.name_MAP[item.service];
        } else {
          item.name = item.service;
        }
      }
      
      return item;
    });
  }

  ngOnInit() {
    this.getAdvancedConfig = this.sysGeneralService.getAdvancedConfig.subscribe((res)=> {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
        this.getAdvancedConfig.unsubscribe();
      }
    });
  }
  
  getActions(parentRow) {
    const actions = [{
      actionName: 'configure',
      name: parentRow.service,
      icon: 'edit',
      id: "Configure",
      label: T("Configure"),
      onClick: (row) => {
        this.editService(row.service);
      }
    }];
    if (parentRow.service === 'netdata' && parentRow.state === 'RUNNING') {
      actions.push({
        actionName: 'launch',
        name: parentRow.service,
        icon: 'featured_play_list',
        id: 'Launch',
        label: T('Launch'),
        onClick: () => {
          this.openNetdataPortal()
        }
      })
    }
    return actions;
  }
  
  onSliderChange(service) {
    this.toggle(service);
  }
  
  onCheckboxChange(service) {
    this.enableToggle(service);
  }

  toggle(service: any) {
    let rpc: string;
    if (service.state != 'RUNNING') {
      rpc = 'service.start';
    } else {
      rpc = 'service.stop';
    }

    if (rpc === 'service.stop') {
      if (service.title == 'iscsitarget') {
        this.iscsiService.getGlobalSessions().subscribe(
          (res) => {
            const msg = res.length == 0 ? '' : T('<font color="red"> There are ') + res.length +
              T(' active iSCSI connections.</font><br>Stop the ' + service.name + ' service and close these connections?');
            this.dialog.confirm(T('Alert'),  msg == '' ? T('Stop ') + service.name + '?' : msg, true, T('Stop')).subscribe(dialogRes => {
              if (dialogRes) {
                this.updateService(rpc, service);
              }
            });
          }
        )
      } else {
        this.dialog.confirm(T('Alert'), T('Stop ') + service.name + '?', true, T('Stop')).subscribe(res => {
          if (res) {
            this.updateService(rpc, service);
          }
        });
      }
    } else {
      this.updateService(rpc, service);
    }

  }

  updateService(rpc, service) {
    service['onChanging'] = true;
    this.busy = this.ws.call(rpc, [service.title]).subscribe((res) => {
      if (res) {
        if (service.state === "RUNNING" && rpc === 'service.stop') {
          this.dialog.Info(T("Service failed to stop"),
              this.name_MAP[service.title] + " " +  T("service failed to stop."));
        }
        service.state = 'RUNNING';
        service['onChanging'] = false;
      } else {
        if (service.state === 'STOPPED' && rpc === 'service.start') {
          this.dialog.Info(T("Service failed to start"),
              this.name_MAP[service.title] + " " +  T("service failed to start."));
        }
        service.state = 'STOPPED';
        service['onChanging'] = false;
      }
    }, (res) => {
      let message = T("Error starting service ");
      if (rpc === 'service.stop') {
        message = T("Error stopping service ");
      }
      this.dialog.errorReport(message + this.name_MAP[service.title], res.message, res.stack);
      service['onChanging'] = false;
    });
  }

  enableToggle(service: any) {
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
      const route = ['sharing', 'iscsi'];
      this.router.navigate(new Array('').concat(route));
    } else if (service === 'cifs') {
      this.router.navigate(new Array('').concat(['services', 'smb']));
    } else {
      // Determines the route path
      this.router.navigate(new Array('').concat(['services', service]));
    }
  }

  openNetdataPortal() {
    window.open('/netdata/');
  }
}
