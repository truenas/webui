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
  adState = '';
  ldapState = '';
  nisState = '';

  constructor(private ws: WebSocketService) { }

  ngOnInit() {
    this.ws.call('activedirectory.get_state').subscribe((res) => {
      this.adState = res;
    });
    this.ws.call('ldap.get_state').subscribe((res) => {
      this.ldapState = res;
    });
    this.ws.call('nis.get_state').subscribe((res) => {
      this.nisState = res;
    });
  }

}
