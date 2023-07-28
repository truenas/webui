import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take } from 'rxjs/operators';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { WebSocketService } from 'app/services/ws.service';

interface DirectoryServicesMonitorRow {
  name: string;
  state: DirectoryServiceState;
  id: string;
}

@UntilDestroy()
@Component({
  templateUrl: './directory-services-monitor.component.html',
  styleUrls: ['./directory-services-monitor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectoryServicesMonitorComponent implements OnInit {
  displayedColumns: string[] = ['icon', 'name', 'state'];
  dataSource: DirectoryServicesMonitorRow[] = [];
  isLoading = false;

  readonly DirectoryServiceState = DirectoryServiceState;

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private dialogRef: MatDialogRef<DirectoryServicesMonitorComponent>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getStatus();
  }

  getStatus(): void {
    this.isLoading = true;
    this.ws.call('directoryservices.get_state').pipe(take(1), untilDestroyed(this)).subscribe((state) => {
      this.isLoading = false;
      this.dataSource = [
        { name: 'Active Directory', state: state.activedirectory, id: 'activedirectory' },
        { name: 'LDAP', state: state.ldap, id: 'ldap' },
      ];
      this.cdr.markForCheck();
    });
  }

  goTo(el: string): void {
    this.dialogRef.close();
    this.router.navigate([`/directoryservice/${el}`]);
  }
}
