import { Component, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
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

  constructor(private ws: WebSocketService, ) {}

  ngOnInit() {
    let tempArray = [];
    this.ws.call('directoryservices.get_state').subscribe((res) => {
      tempArray.push({name: 'Active Directory', state: res.activedirectory});
      tempArray.push({name: 'LDAP', state: res.ldap});
      tempArray.push({name: 'NIS', state: res.nis});
      this.dataSource = tempArray;
    });
    this.ws.subscribe('directoryservices.status').subscribe((res) => {
      let tempArray = [];
      if (res) {
        tempArray.push({name: 'Active Directory', state: res.fields.activedirectory});
        tempArray.push({name: 'LDAP', state: res.fields.ldap});
        tempArray.push({name: 'NIS', state: res.fields.nis});
        this.dataSource = tempArray;
      }
    })
  }
}
