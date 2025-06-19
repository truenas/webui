import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog, MatDialogRef, MatDialogState } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter, Subscription, switchMap } from 'rxjs';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {
  DirectoryServicesMonitorComponent,
} from 'app/modules/layout/topbar/directory-services-indicator/directory-services-monitor/directory-services-monitor.component';
import { topbarDialogPosition } from 'app/modules/layout/topbar/topbar-dialog-position.constant';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-directory-services-indicator',
  templateUrl: './directory-services-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    MatTooltip,
    IxIconComponent,
    TranslateModule,
    TestDirective,
  ],
})
export class DirectoryServicesIndicatorComponent implements OnInit, OnDestroy {
  protected tooltips = helptextTopbar.tooltips;

  protected isIconShown = signal(false);

  private servicesMonitorRef: MatDialogRef<DirectoryServicesMonitorComponent>;
  private statusSubscription: Subscription;

  constructor(
    private api: ApiService,
    private matDialog: MatDialog,
    private auth: AuthService,
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
    this.api.call('directoryservices.get_state')
      .pipe(untilDestroyed(this))
      .subscribe((state) => {
        this.updateIconVisibility(state);
      });
    this.statusSubscription = this.auth.hasRole(Role.DirectoryServiceRead)
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.subscribe('directoryservices.status')),
        untilDestroyed(this),
      )
      .subscribe((event) => {
        this.updateIconVisibility(event.fields);
      });
  }

  private updateIconVisibility(servicesState: DirectoryServicesState): void {
    const anyServiceEnabled = Object.values(servicesState).some((service: DirectoryServiceState) => {
      return service !== DirectoryServiceState.Disabled;
    });
    this.isIconShown.set(anyServiceEnabled);
  }
}
