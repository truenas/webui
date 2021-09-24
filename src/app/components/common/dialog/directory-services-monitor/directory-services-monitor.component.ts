import {
  animate, state, style, transition, trigger,
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { WebSocketService } from 'app/services';

interface DirectoryServicesMonitorRow {
  name: string;
  state: DirectoryServiceState;
  id: string;
}

@UntilDestroy()
@Component({
  selector: 'app-directory-services-monitor',
  templateUrl: './directory-services-monitor.component.html',
  styleUrls: ['./directory-services-monitor.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class DirectoryServicesMonitorComponent implements OnInit {
  displayedColumns: string[] = ['icon', 'name', 'state'];
  dataSource: DirectoryServicesMonitorRow[] = [];
  showSpinner = false;

  readonly DirectoryServiceState = DirectoryServiceState;

  constructor(private ws: WebSocketService, private router: Router) {}

  ngOnInit(): void {
    this.getStatus();
  }

  getStatus(): void {
    const tempArray: DirectoryServicesMonitorRow[] = [];
    this.showSpinner = true;
    this.ws.call('directoryservices.get_state').pipe(untilDestroyed(this)).subscribe((res) => {
      this.showSpinner = false;
      tempArray.push({ name: 'Active Directory', state: res.activedirectory, id: 'activedirectory' });
      tempArray.push({ name: 'LDAP', state: res.ldap, id: 'ldap' });
      this.dataSource = tempArray;
    });
  }

  goTo(el: string): void {
    this.router.navigate([`/directoryservice/${el}`]);
  }
}
