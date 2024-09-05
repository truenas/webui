import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy, Component, OnInit,
  signal,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { DirectoryServiceState, directoryServiceStateLabels } from 'app/enums/directory-service-state.enum';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-directory-services-monitor',
  templateUrl: './directory-services-monitor.component.html',
  styleUrls: ['./directory-services-monitor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CdkScrollable,
    MatDialogContent,
    MatIconButton,
    TestIdModule,
    IxIconModule,
    MatDialogClose,
    MatProgressSpinner,
    RouterLink,
    TranslateModule,
    MapValuePipe,
  ],
})
export class DirectoryServicesMonitorComponent implements OnInit {
  protected readonly isLoading = signal(false);
  protected readonly serviceName = signal<string>('');
  protected readonly state = signal<DirectoryServiceState | null>(null);

  protected readonly DirectoryServiceState = DirectoryServiceState;
  protected readonly directoryServiceStateLabels = directoryServiceStateLabels;

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.getStatus();
  }

  getStatus(): void {
    this.isLoading.set(true);
    this.ws.call('directoryservices.get_state')
      .pipe(
        this.errorHandler.catchError(),
        finalize(() => this.isLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe((state) => {
        if (state.ldap !== DirectoryServiceState.Disabled) {
          this.serviceName.set('LDAP');
          this.state.set(state.ldap);
        } else {
          this.serviceName.set('Active Directory');
          this.state.set(state.activedirectory);
        }
      });
  }
}
