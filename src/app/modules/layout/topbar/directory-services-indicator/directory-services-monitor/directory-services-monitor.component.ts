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
import {
  directoryServiceNames, directoryServiceStateLabels, DirectoryServiceStatus,
} from 'app/enums/directory-services.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-directory-services-monitor',
  templateUrl: './directory-services-monitor.component.html',
  styleUrls: ['./directory-services-monitor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    MatIconButton,
    IxIconComponent,
    MatDialogClose,
    MatProgressSpinner,
    RouterLink,
    TranslateModule,
    MapValuePipe,
    TestDirective,
  ],
})
export class DirectoryServicesMonitorComponent implements OnInit {
  protected readonly isLoading = signal(false);
  protected readonly serviceName = signal<string>('');
  protected readonly state = signal<DirectoryServiceStatus | null>(null);

  protected readonly DirectoryServiceState = DirectoryServiceStatus;
  protected readonly directoryServiceStateLabels = directoryServiceStateLabels;

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.getStatus();
  }

  getStatus(): void {
    this.isLoading.set(true);
    this.api.call('directoryservices.status')
      .pipe(
        this.errorHandler.withErrorHandler(),
        finalize(() => this.isLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe((state) => {
        this.serviceName.set(directoryServiceNames[state.type]);
        this.state.set(state.status);
      });
  }
}
