import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest, map, Subscription, switchMap, tap,
} from 'rxjs';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ToolbarSliderComponent } from 'app/modules/forms/toolbar-slider/toolbar-slider.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { LogsDetailsDialogComponent } from 'app/pages/apps/components/logs-details-dialog/logs-details-dialog.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ShellService } from 'app/services/shell.service';
import { WebSocketService } from 'app/services/ws.service';

interface ContainerLogEvent {
  data: string;
  timestamp: string;
  msg?: string;
  collection?: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-container-logs',
  templateUrl: './container-logs.component.html',
  styleUrls: ['./container-logs.component.scss'],
  providers: [ShellService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  @ViewChild('logContainer', { static: true }) logContainer: ElementRef<HTMLElement>;

  fontSize = 14;
  appName: string;
  containerId: string;
  subscriptionMethod = '';
  isLoading = false;
  defaultTailLines = 500;

  private logsChangedListener: Subscription;
  logs: ContainerLogEvent[] = [];

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    protected download: DownloadService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
    private location: Location,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    combineLatest([this.aroute.params, this.aroute.parent.params]).pipe(
      untilDestroyed(this),
    ).subscribe(([params, parentParams]) => {
      this.appName = parentParams.appId as string;
      this.containerId = params.containerId as string;

      this.reconnect();
    });
  }

  // subscribe pod log for selected app, pod and container.
  reconnect(): void {
    if (this.logsChangedListener && !this.logsChangedListener.closed) {
      this.logsChangedListener.unsubscribe();
    }

    this.logsChangedListener = this.matDialog.open(LogsDetailsDialogComponent, { width: '400px' }).afterClosed().pipe(
      tap((value: LogsDetailsDialogComponent['form']['value'] | boolean) => {
        if (typeof value === 'boolean' && !value) {
          this.location.back();
        }
      }),
      tap((details: LogsDetailsDialogComponent['form']['value']) => {
        this.subscriptionMethod = `app.container_log_follow: ${JSON.stringify({
          app_name: this.appName,
          container_id: this.containerId,
          tail_lines: details.tail_lines || this.defaultTailLines,
        })}`;

        this.logs = [];
        this.isLoading = true;
      }),
      switchMap(() => this.ws.subscribeToLogs(this.subscriptionMethod)),
      map((apiEvent) => apiEvent.fields),
      untilDestroyed(this),
    ).subscribe({
      next: (log: ContainerLogEvent) => {
        this.isLoading = false;

        if (log && log.msg !== 'nosub') {
          this.logs.push(log);
          this.scrollToBottom();
        }

        this.cdr.markForCheck();
      },
      error: (error: WebSocketError) => {
        this.isLoading = false;
        if (error.reason) {
          this.dialogService.error(this.errorHandler.parseError(error));
        }
        this.cdr.markForCheck();
      },
    });
  }

  scrollToBottom(): void {
    try {
      this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
    } catch (_: unknown) {
      // Ignore error
    }
  }

  onFontSizeChanged(newSize: number): void {
    this.fontSize = newSize;
  }
}
