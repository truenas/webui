import { Component, OnInit, ViewChild } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatTableDataSource, MatDialogTitle, MatTable } from '@angular/material';

import { WebSocketService } from '../../../../services/';

@Component({
  selector: 'app-directory-services-monitor',
  templateUrl: './directory-services-monitor.component.html',
  styleUrls: ['./directory-services-monitor.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ]
})
export class DirectoryServicesMonitorComponent implements OnInit {
  displayedColumns: string[] = ['icon', 'name', 'state'];
  dataSource = [];
  @ViewChild('dirServiceTable') dirServiceTable: MatTable<any>;

  constructor(private ws: WebSocketService, ) {}

  ngOnInit() {
    const tempArr = [];
    this.ws.call('activedirectory.get_state').subscribe((res) => {
      const icon = this.getIcon(res);
      tempArr.push({icon: icon, name: 'Active Directory', state: res});

      this.ws.call('ldap.get_state').subscribe((res) => {
        const icon = this.getIcon(res);
        tempArr.push({icon: icon, name: 'LDAP', state: res});

        this.ws.call('nis.get_state').subscribe((res) => {
          const icon = this.getIcon(res);
          tempArr.push({icon: icon, name: 'NIS', state: res});
          console.log(tempArr);
          this.dataSource = tempArr;
        });
      });
    });
  }

  getIcon(state) {
    switch(state) {
      case "DISABLED":
        return 'remove_circle';
        break;
      case 'HEALTHY':
        return 'check_circle'
        break;
      case 'FAULTED':
        return 'highlight_off'
        break;
      case 'JOINING':
        return 'arrow_forward'
        break;
      case 'LEAVING':
        return 'arrow_back'
        break;
      default:
        return 'remove_circle'
    }
  }
}
