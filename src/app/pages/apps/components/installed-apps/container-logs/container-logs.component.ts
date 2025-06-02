import {
  ChangeDetectionStrategy, Component, ElementRef, OnInit, signal, Signal, viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest, map, Subscription, switchMap, tap,
} from 'rxjs';
import { AppContainerLog } from 'app/interfaces/app.interface';
import { ToolbarSliderComponent } from 'app/modules/forms/toolbar-slider/toolbar-slider.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { LogsDetailsDialog } from 'app/pages/apps/components/logs-details-dialog/logs-details-dialog.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ShellService } from 'app/services/shell.service';

@UntilDestroy()
@Component({
  selector: 'ix-container-logs',
  templateUrl: './container-logs.component.html',
  styleUrls: ['./container-logs.component.scss'],
  providers: [ShellService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    ToolbarSliderComponent,
    MatButton,
    TestDirective,
    TranslateModule,
    MatProgressSpinner,
  ],
})
export class ContainerLogsComponent implements OnInit {
  private logContainer: Signal<ElementRef<HTMLElement>> = viewChild.required('logContainer', { read: ElementRef });

  protected fontSize = signal(14);
  protected isLoading = signal(false);

  protected train: string;
  protected appName: string;
  protected containerId: string;
  protected logs = signal<AppContainerLog[]>([]);

  private defaultTailLines = 500;
  private logsChangedListener: Subscription;

  constructor(
    private api: ApiService,
    protected aroute: ActivatedRoute,
    protected loader: LoaderService,
    protected download: DownloadService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.aroute.parent) {
      throw new Error('Parent route is not found');
    }

    combineLatest([this.aroute.params, this.aroute.parent.params]).pipe(
      untilDestroyed(this),
    ).subscribe(([params, parentParams]) => {
      this.appName = parentParams.appId as string;
      this.train = parentParams.train as string;
      this.containerId = params.containerId as string;

      this.reconnect();
    });
  }

  // subscribe pod log for selected app, pod and container.
  reconnect(): void {
    if (this.logsChangedListener && !this.logsChangedListener.closed) {
      this.logsChangedListener.unsubscribe();
    }

    this.logsChangedListener = this.matDialog.open(LogsDetailsDialog, { width: '400px' }).afterClosed().pipe(
      tap((value: LogsDetailsDialog['form']['value'] | boolean) => {
        if (typeof value === 'boolean' && !value) {
          this.router.navigate(['/apps/installed/', this.train, this.appName]);
          return;
        }

        this.logs.set([]);
        this.isLoading.set(true);
      }),
      switchMap((details: LogsDetailsDialog['form']['value']) => {
        return this.api.subscribe(`app.container_log_follow: ${JSON.stringify({
          app_name: this.appName,
          container_id: this.containerId,
          tail_lines: details?.tail_lines || this.defaultTailLines,
        })}`);
      }),
      map((apiEvent) => apiEvent.fields),
      untilDestroyed(this),
    ).subscribe({
      next: (log: AppContainerLog) => {
        this.isLoading.set(false);

        if (log && log.msg !== 'nosub') {
          this.logs.set([...this.logs(), log]);
          this.scrollToBottom();
        }
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  scrollToBottom(): void {
    try {
      this.logContainer().nativeElement.scrollTop = this.logContainer().nativeElement.scrollHeight;
    } catch (_: unknown) {
      // Ignore error
    }
  }

  onFontSizeChanged(newSize: number): void {
    this.fontSize.set(newSize);
  }
}
