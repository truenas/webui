import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef, MatLegacyDialogState as MatDialogState } from '@angular/material/legacy-dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import helptext from 'app/helptext/topbar';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import {
  DirectoryServicesMonitorComponent,
} from 'app/modules/common/dialog/directory-services-monitor/directory-services-monitor.component';
import { topbarDialogPosition } from 'app/modules/layout/components/topbar/topbar-dialog-position.constant';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-directory-services-indicator',
  templateUrl: './directory-services-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectoryServicesIndicatorComponent implements OnInit {
  tooltips = helptext.mat_tooltips;

  isIconShown = false;

  private servicesMonitorRef: MatDialogRef<DirectoryServicesMonitorComponent>;

  constructor(
    private ws: WebSocketService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) { }

  get isServicesMonitorOpen(): boolean {
    return this.servicesMonitorRef?.getState() === MatDialogState.OPEN;
  }

  ngOnInit(): void {
    this.loadDirectoryServicesStatus();
  }

  onIndicatorClicked(): void {
    if (this.isServicesMonitorOpen) {
      this.servicesMonitorRef.close(true);
    } else {
      this.servicesMonitorRef = this.dialog.open(DirectoryServicesMonitorComponent, {
        hasBackdrop: true,
        panelClass: 'topbar-panel',
        position: topbarDialogPosition,
      });
    }
  }

  private loadDirectoryServicesStatus(): void {
    this.ws.call('directoryservices.get_state').pipe(untilDestroyed(this)).subscribe((state) => {
      this.updateIconVisibility(state);
    });
    this.ws.newSub('directoryservices.status')
      .pipe(untilDestroyed(this))
      .subscribe((event) => {
        this.updateIconVisibility(event.fields);
      });
  }

  updateIconVisibility(servicesState: DirectoryServicesState): void {
    this.isIconShown = Object.values(servicesState).some((service: DirectoryServiceState) => {
      return service !== DirectoryServiceState.Disabled;
    });
    this.cdr.markForCheck();
  }
}
