import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl, FormBuilder, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialog,
} from '@angular/material/dialog';
import {
  MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatProgressBar } from '@angular/material/progress-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Role } from 'app/enums/role.enum';
import { isFailedJobError } from 'app/helpers/api.helper';
import { helptextVolumes } from 'app/helptext/storage/volumes/volume-list';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { Job } from 'app/interfaces/job.interface';
import { PoolAttachment } from 'app/interfaces/pool-attachment.interface';
import { isServicesToBeRestartedInfo, ServicesToBeRestartedInfo } from 'app/interfaces/pool-export.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Process } from 'app/interfaces/process.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import {
  ServicesToBeRestartedDialogComponent,
} from 'app/pages/storage/components/dashboard-pool/export-disconnect-modal/services-need-to-be-restarted-dialog/services-to-be-restarted-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { selectIsHaEnabled } from 'app/store/ha-info/ha-info.selectors';

export enum DisconnectOption {
  Export = 'export',
  Delete = 'delete',
}

@UntilDestroy()
@Component({
  selector: 'ix-export-disconnect-modal',
  styleUrls: ['./export-disconnect-modal.component.scss'],
  templateUrl: './export-disconnect-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatProgressBar,
    ReactiveFormsModule,
    MatDialogContent,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
    IxIconComponent,
  ],
})
export class ExportDisconnectModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject<MatDialogRef<ExportDisconnectModalComponent>>(MatDialogRef);
  private translate = inject(TranslateService);
  private validatorsService = inject(IxValidatorsService);
  private dialogService = inject(DialogService);
  private matDialog = inject(MatDialog);
  private loader = inject(LoaderService);
  private api = inject(ApiService);
  private datasetStore = inject(DatasetTreeStore);
  private cdr = inject(ChangeDetectorRef);
  private snackbar = inject(SnackbarService);
  private errorHandler = inject(ErrorHandlerService);
  private store = inject(Store);
  pool = inject<Pool>(MAT_DIALOG_DATA);

  readonly helptext = helptextVolumes;

  readonly nameInputRequired = this.validatorsService.withMessage(
    Validators.required,
    this.translate.instant('Name of the pool is required'),
  );

  readonly nameInputMustMatch = this.validatorsService.withMessage(
    Validators.pattern(new RegExp(`^${this.pool.name}$`)),
    this.translate.instant('Name of the pool must be correct'),
  );

  showSysDatasetWarning: boolean;
  showUnknownStatusDetachWarning: boolean;
  selectedOption = signal<DisconnectOption | null>(null);


  attachments: PoolAttachment[] = [];
  processes: Process[] = [];
  process = {
    knownProcesses: [] as Process[],
    unknownProcesses: [] as Process[],
  };

  systemConfig: SystemDatasetConfig;
  totalPoolCount = 0;
  isHaEnabled = false;
  failoverConfig: FailoverConfig;

  isFormLoading = false;
  form = this.fb.nonNullable.group({
    destroy: [false],
    cascade: [true],
    confirm: [false, [Validators.requiredTrue]],
    nameInput: ['', [
      this.validatorsService.validateOnCondition(
        (control: AbstractControl) => control.parent?.get('destroy')?.value,
        this.nameInputRequired,
      ),
      this.validatorsService.validateOnCondition(
        (control: AbstractControl) => control.parent?.get('destroy')?.value,
        this.nameInputMustMatch,
      ),
    ]],
  });

  restartServices = false;

  protected readonly Role = Role;

  get exportOption(): DisconnectOption {
    return DisconnectOption.Export;
  }

  get deleteOption(): DisconnectOption {
    return DisconnectOption.Delete;
  }

  ngOnInit(): void {
    // Auto-select Export pool by default
    this.selectOption(DisconnectOption.Export);

    if (this.pool.status === PoolStatus.Unknown) {
      this.prepareForm();
      return;
    }

    this.loadRelatedEntities();
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  isLastPoolInHaSystem(): boolean {
    return this.isHaEnabled
      && this.failoverConfig
      && !this.failoverConfig.disabled
      && this.totalPoolCount === 1;
  }

  startExportDisconnectJob(): void {
    const value = this.form.getRawValue();

    const job$ = this.api.job('pool.export', [
      this.pool.id,
      {
        destroy: value.destroy,
        cascade: value.cascade,
        restart_services: this.restartServices,
      },
    ]);

    this.dialogService.jobDialog(
      job$,
      {
        title: this.translate.instant(helptextVolumes.exporting),
        description: this.translate.instant(helptextVolumes.exporting),
      },
    )
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.handleDisconnectJobSuccess(value);
        },
        error: (error: unknown) => {
          this.handleDisconnectJobFailure(error);
        },
        complete: () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      });

    this.datasetStore.resetDatasets();
  }

  private handleDisconnectJobFailure(error: unknown): void {
    if (isFailedJobError(error) && error.job.error) {
      if (isServicesToBeRestartedInfo(error.job.exc_info.extra)) {
        this.showServicesToBeRestartedDialog(error.job.exc_info.extra);
        return;
      }
      if (error.job.extra?.code === 'unstoppable_processes') {
        this.showUnstoppableErrorDialog(error.job);
        return;
      }
    }

    this.errorHandler.showErrorModal(error);
  }

  private showUnstoppableErrorDialog(failureData: Job): void {
    let conditionalErrMessage = '';
    const msg = this.translate.instant(helptextVolumes.exportMessages.unableToTerminate);
    conditionalErrMessage = msg + (failureData.extra?.processes as string);
    this.dialogService.error({
      title: helptextVolumes.exportError,
      message: conditionalErrMessage,
      stackTrace: failureData.exception,
    });
  }

  private showServicesToBeRestartedDialog(servicesInfo: ServicesToBeRestartedInfo): void {
    this.matDialog.open(ServicesToBeRestartedDialogComponent, {
      data: servicesInfo,
    })
      .afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.restartServices = true;
        this.startExportDisconnectJob();
        this.cdr.markForCheck();
      });
  }

  private handleDisconnectJobSuccess(value: Partial<{
    destroy: boolean;
    cascade: boolean;
    confirm: boolean;
    nameInput: string;
  }>): void {
    this.isFormLoading = false;
    this.dialogRef.close(true);

    if (value.destroy) {
      const message = this.translate.instant('Pool «{pool}» has been deleted successfully. All data on that pool was destroyed.', {
        pool: this.pool.name,
      });
      this.snackbar.success(message);
    } else {
      const message = this.translate.instant('Pool «{pool}» has been exported successfully.', {
        pool: this.pool.name,
      });
      this.snackbar.success(message);
    }
  }

  private loadRelatedEntities(): void {
    forkJoin([
      this.api.call('pool.attachments', [this.pool.id]),
      this.api.call('pool.processes', [this.pool.id]),
      this.api.call('systemdataset.config'),
      this.api.call('pool.query', [[], { count: true }]),
      this.store.select(selectIsHaEnabled).pipe(take(1)),
      this.api.call('failover.config'),
    ])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(([attachments, processes, systemConfig, poolCount, isHaEnabled, failoverConfig]) => {
        this.attachments = attachments;
        this.processes = processes;
        this.organizeProcesses(processes);
        this.systemConfig = systemConfig;
        this.totalPoolCount = poolCount as unknown as number;
        this.isHaEnabled = isHaEnabled;
        this.failoverConfig = failoverConfig;
        this.prepareForm();
        this.cdr.markForCheck();
      });
  }

  private prepareForm(): void {
    this.showSysDatasetWarning = this.pool.name === this.systemConfig?.pool;
    this.showUnknownStatusDetachWarning = this.pool.status === PoolStatus.Unknown;

    this.form.controls.destroy.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.resetNameInputValidState());
  }

  selectOption(option: DisconnectOption | null): void {
    this.selectedOption.set(option);
    if (option) {
      this.form.patchValue({
        destroy: option === DisconnectOption.Delete,
        confirm: false,
      });
      this.resetNameInputValidState();
    }
    this.cdr.markForCheck();
  }

  get isExportSelected(): boolean {
    return this.selectedOption() === DisconnectOption.Export;
  }

  get isDeleteSelected(): boolean {
    return this.selectedOption() === DisconnectOption.Delete;
  }

  canProceed(): boolean {
    return this.selectedOption() !== null
      && this.form.valid
      && !this.isFormLoading
      && !this.isLastPoolInHaSystem();
  }

  get dependencyCount(): number {
    return this.attachments.length + this.process.knownProcesses.length + this.process.unknownProcesses.length;
  }

  private resetNameInputValidState(): void {
    this.form.controls.nameInput.reset();
    this.form.controls.nameInput.setErrors(null);
  }

  private organizeProcesses(processes: Process[]): void {
    this.process = {
      knownProcesses: processes.filter((process) => process.name && process.name.trim() !== ''),
      unknownProcesses: processes.filter((process) => !process.name || process.name.trim() === ''),
    };
  }
}
