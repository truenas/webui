import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
    ])
  ]
})
export class DirectoryServicesMonitorComponent implements OnInit {
  displayedColumns: string[] = ['icon', 'name', 'state'];
  dataSource = [];
  showSpinner = false;

  constructor(private ws: WebSocketService, private router: Router ) {}

  ngOnInit() {
    this.getStatus();
  }

  getStatus() {
    let tempArray = [];
    this.showSpinner = true;
    this.ws.call('directoryservices.get_state').subscribe((res) => {
      this.showSpinner = false;
      tempArray.push({name: 'Active Directory', state: res.activedirectory, id: 'activedirectory'});
      tempArray.push({name: 'LDAP', state: res.ldap, id: 'ldap'});
      tempArray.push({name: 'NIS', state: res.nis, id: 'nis'});
      this.dataSource = tempArray;
    });
  }

  goTo(el) {
    this.router.navigate([`/directoryservice/${el}`])
  }
}
