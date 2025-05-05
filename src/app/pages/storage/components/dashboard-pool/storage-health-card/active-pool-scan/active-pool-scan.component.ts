import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { formatDuration } from 'date-fns';
import { filter, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { Role } from 'app/enums/role.enum';
import { secondsToDuration } from 'app/helpers/time.helpers';
import { Pool, PoolScanUpdate } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-active-pool-scan',
  imports: [
    MatProgressBar,
    PercentPipe,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    TranslateModule,
  ],
  templateUrl: './active-pool-scan.component.html',
  styleUrl: './active-pool-scan.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivePoolScanComponent {
  readonly scan = input.required<PoolScanUpdate>();
  readonly pool = input.required<Pool>();

  protected readonly isScrub = computed(() => this.scan()?.function === PoolScanFunction.Scrub);
  protected readonly isScrubPaused = computed(() => Boolean(this.scan()?.pause));

  protected readonly Role = Role;

  constructor(
    private translate: TranslateService,
    private dialogService: DialogService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
  ) {}

  protected scanLabel = computed(() => {
    if (!this.isScrub()) {
      return this.translate.instant('Resilvering:');
    }

    if (this.isScrubPaused()) {
      return this.translate.instant('Scrub Paused');
    }

    return this.translate.instant('Scrub In Progress:');
  });

  protected readonly timeLeftString = computed(() => {
    try {
      const duration = secondsToDuration(this.scan().total_secs_left || 0);
      return this.translate.instant('{duration} remaining', { duration: formatDuration(duration) });
    } catch {
      return ' - ';
    }
  });

  protected onStopScrub(): void {
    const message = this.translate.instant('Stop the scrub on {poolName}?', { poolName: this.pool().name });
    this.dialogService.confirm({
      message,
      title: this.translate.instant('Scrub Pool'),
      buttonText: this.translate.instant('Stop Scrub'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.startJob('pool.scrub', [this.pool().id, PoolScrubAction.Stop])),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe();
  }

  protected onPauseScrub(): void {
    this.api.startJob('pool.scrub', [this.pool().id, PoolScrubAction.Pause])
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe();
  }

  protected onResumeScrub(): void {
    this.api.startJob('pool.scrub', [this.pool().id, PoolScrubAction.Start])
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe();
  }
}
