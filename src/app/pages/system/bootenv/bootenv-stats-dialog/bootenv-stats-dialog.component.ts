import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { PoolStatus, poolStatusLabels } from 'app/enums/pool-status.enum';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  templateUrl: './bootenv-stats-dialog.component.html',
  styleUrls: ['./bootenv-stats-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootenvStatsDialogComponent implements OnInit {
  form = this.fb.group({
    interval: [null as number, [Validators.required, Validators.min(1)]],
  });

  state: PoolInstance;

  readonly PoolStatus = PoolStatus;
  readonly poolStatusLabels = poolStatusLabels;

  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private store$: Store<AppState>,
    private dialogRef: MatDialogRef<BootenvStatsDialogComponent>,
    private translate: TranslateService,
    private fb: FormBuilder,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
  ) {}

  get condition(): PoolStatus {
    return this.state.status;
  }

  ngOnInit(): void {
    this.loadBootState();
    this.loadScrubInterval();
  }

  onSubmit(): void {
    const interval = this.form.value.interval;
    this.ws.call('boot.set_scrub_interval', [interval])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: () => {
          this.dialogRef.close();
          this.snackbar.success(
            this.translate.instant('Scrub interval set to {scrubIntervalValue} days', { scrubIntervalValue: interval }),
          );
        },
        error: (error) => {
          this.formErrorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  private loadScrubInterval(): void {
    this.store$.pipe(waitForAdvancedConfig, untilDestroyed(this)).subscribe((config) => {
      this.form.patchValue({ interval: config.boot_scrub });
    });
  }

  private loadBootState(): void {
    this.ws.call('boot.get_state')
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((state) => {
        this.state = state;
        this.cdr.markForCheck();
      });
  }
}
