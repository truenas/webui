import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogTitle, MatDialogClose } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { PoolStatus, poolStatusLabels } from 'app/enums/pool-status.enum';
import { Role } from 'app/enums/role.enum';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-bootenv-stats-dialog',
  templateUrl: './bootenv-stats-dialog.component.html',
  styleUrls: ['./bootenv-stats-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    MatDialogClose,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
    FileSizePipe,
    FormatDateTimePipe,
    MapValuePipe,
  ],
})
export class BootenvStatsDialogComponent implements OnInit {
  form = this.fb.group({
    interval: [null as number, [Validators.required, Validators.min(1)]],
  });

  state: PoolInstance;

  readonly PoolStatus = PoolStatus;
  readonly poolStatusLabels = poolStatusLabels;
  protected readonly Role = Role;

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
        error: (error: unknown) => {
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
