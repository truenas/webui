import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog, MatDialogRef, MatDialogState } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {
  DirectoryServicesMonitorComponent,
} from 'app/modules/layout/topbar/directory-services-indicator/directory-services-monitor/directory-services-monitor.component';
import { topbarDialogPosition } from 'app/modules/layout/topbar/topbar-dialog-position.constant';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-directory-services-indicator',
  templateUrl: './directory-services-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    MatTooltip,
    IxIconComponent,
    TranslateModule,
    TestDirective,
  ],
})
export class DirectoryServicesIndicatorComponent implements OnInit, OnDestroy {
  tooltips = helptextTopbar.mat_tooltips;

  isIconShown = false;

  private servicesMonitorRef: MatDialogRef<DirectoryServicesMonitorComponent>;
  private statusSubscription: Subscription;

  constructor(
    private ws: WebSocketService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) { }

  get isServicesMonitorOpen(): boolean {
    return this.servicesMonitorRef?.getState() === MatDialogState.OPEN;
  }

  ngOnInit(): void {
    this.loadDirectoryServicesStatus();
  }

  ngOnDestroy(): void {
    this.statusSubscription?.unsubscribe();
  }

  onIndicatorClicked(): void {
    if (this.isServicesMonitorOpen) {
      this.servicesMonitorRef.close(true);
    } else {
      this.servicesMonitorRef = this.matDialog.open(DirectoryServicesMonitorComponent, {
        hasBackdrop: true,
        panelClass: 'topbar-panel',
        position: topbarDialogPosition,
      });
    }
  }

  private loadDirectoryServicesStatus(): void {
    // TODO: Sync endpoints
    this.ws.call('directoryservices.get_state').pipe(untilDestroyed(this)).subscribe((state) => {
      this.updateIconVisibility(state);
    });
    this.statusSubscription = this.ws.subscribe('directoryservices.status').pipe(untilDestroyed(this)).subscribe((event) => {
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
