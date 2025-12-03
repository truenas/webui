import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, output, ViewChild, viewChild, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCard } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import {
  MatStepper, MatStep, MatStepLabel,
} from '@angular/material/stepper';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { StepActivationDirective } from 'app/directives/step-activation.directive';
import {
  CreatePool, Pool, UpdatePool,
} from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {
  UseIxIconsInStepperComponent,
} from 'app/modules/ix-icon/use-ix-icons-in-stepper/use-ix-icons-in-stepper.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import {
  DownloadKeyDialog, DownloadKeyDialogParams,
} from 'app/pages/storage/modules/pool-manager/components/download-key-dialog/download-key-dialog.component';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { PoolCreationWizardStep, getPoolCreationWizardStepIndex } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import { PoolManagerValidationService } from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import { PoolManagerState, PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { topologyToPayload } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { selectHasEnclosureSupport } from 'app/store/system-info/system-info.selectors';
import { GeneralWizardStepComponent } from './steps/1-general-wizard-step/general-wizard-step.component';
import { EnclosureWizardStepComponent } from './steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { DataWizardStepComponent } from './steps/3-data-wizard-step/data-wizard-step.component';
import { LogWizardStepComponent } from './steps/4-log-wizard-step/log-wizard-step.component';
import { SpareWizardStepComponent } from './steps/5-spare-wizard-step/spare-wizard-step.component';
import { CacheWizardStepComponent } from './steps/6-cache-wizard-step/cache-wizard-step.component';
import { MetadataWizardStepComponent } from './steps/7-metadata-wizard-step/metadata-wizard-step.component';
import { DedupWizardStepComponent } from './steps/8-dedup-wizard-step/dedup-wizard-step.component';
import { ReviewWizardStepComponent } from './steps/9-review-wizard-step/review-wizard-step.component';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager-wizard',
  templateUrl: './pool-manager-wizard.component.html',
  styleUrls: ['./pool-manager-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    ReactiveFormsModule,
    MatStepper,
    MatStep,
    StepActivationDirective,
    MatStepLabel,
    IxIconComponent,
    MatTooltip,
    GeneralWizardStepComponent,
    EnclosureWizardStepComponent,
    DataWizardStepComponent,
    LogWizardStepComponent,
    SpareWizardStepComponent,
    CacheWizardStepComponent,
    MetadataWizardStepComponent,
    DedupWizardStepComponent,
    ReviewWizardStepComponent,
    TranslateModule,
    AsyncPipe,
    UseIxIconsInStepperComponent,
  ],
  providers: [
    PoolManagerValidationService,
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true },
    },
  ],
})
export class PoolManagerWizardComponent implements OnInit, OnDestroy {
  private store = inject(PoolManagerStore);
  private systemStore$ = inject<Store<AppState>>(Store);
  private matDialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private poolManagerValidation = inject(PoolManagerValidationService);
  private addVdevsStore = inject(AddVdevsStore);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  @ViewChild('generalStep') generalStep: GeneralWizardStepComponent;
  @ViewChild('enclosureStep') enclosureStep: EnclosureWizardStepComponent;

  protected existingPool: Pool | null = null;

  readonly stepChanged = output<PoolCreationWizardStep>();

  private readonly stepper = viewChild.required('stepper', { read: MatStepper });

  isLoading$ = combineLatest([this.store.isLoading$, this.addVdevsStore.isLoading$]).pipe(
    map(([storeLoading, secondaryLoading]) => storeLoading || secondaryLoading),
  );

  usesDraidLayout$ = this.store.usesDraidLayout$;

  activeStep: PoolCreationWizardStep = PoolCreationWizardStep.General;
  hasEnclosureStep = false;
  state: PoolManagerState;
  topLevelWarningsForEachStep: Partial<Record<PoolCreationWizardStep, string | null>>;
  topLevelErrorsForEachStep: Partial<Record<PoolCreationWizardStep, string | null>>;
  activatedSteps: Partial<Record<PoolCreationWizardStep, boolean>> = {};

  protected readonly PoolCreationWizardStep = PoolCreationWizardStep;

  get hasSoftwareEncryption(): boolean {
    return this.state.encryptionType === EncryptionType.Software;
  }

  get isFormDirty(): boolean {
    return this.generalStep?.form?.dirty || this.enclosureStep?.form?.dirty;
  }

  ngOnInit(): void {
    this.connectToStore();
    this.checkEnclosureStepAvailability();
    this.listenForStartOver();
    this.loadExistingPoolDetails();
  }

  ngOnDestroy(): void {
    this.addVdevsStore.resetStoreToInitialState();
    this.store.resetStoreToInitialState();
  }

  private loadExistingPoolDetails(): void {
    this.addVdevsStore.pool$.pipe(
      filter(Boolean),
      tap((pool) => {
        this.existingPool = pool;
        this.cdr.markForCheck();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  getTopLevelWarningForStep(step: PoolCreationWizardStep): string | null | undefined {
    return this.topLevelWarningsForEachStep?.[step];
  }

  getTopLevelErrorForStep(step: PoolCreationWizardStep): string {
    return this.topLevelErrorsForEachStep?.[step] || '';
  }

  getWasStepActivated(step: PoolCreationWizardStep): boolean {
    return Boolean(this.activatedSteps?.[step]);
  }

  createPool(): void {
    const payload = this.prepareCreatePayload();

    // If SED encryption is selected and a password was entered, update global SED password first
    const sedPasswordUpdate$ = this.state.encryptionType === EncryptionType.Sed && this.state.sedPassword
      ? this.api.call('system.advanced.update', [{ sed_passwd: this.state.sedPassword }])
      : of(null);

    sedPasswordUpdate$.pipe(
      switchMap(() => {
        return this.dialogService.jobDialog(
          this.api.job('pool.create', [payload]),
          { title: this.translate.instant('Create Pool') },
        ).afterClosed();
      }),
      switchMap((job) => {
        if (!this.hasSoftwareEncryption) {
          return of(null);
        }

        return this.matDialog.open<DownloadKeyDialog, DownloadKeyDialogParams>(DownloadKeyDialog, {
          disableClose: true,
          data: job.result,
        }).afterClosed();
      }),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.generalStep?.form?.markAsPristine();
      this.enclosureStep?.form?.markAsPristine();
      this.snackbar.success(this.translate.instant('Pool created successfully'));
      this.router.navigate(['/storage']);
    });
  }

  onStepActivated(step: PoolCreationWizardStep): void {
    this.activeStep = step;
    this.stepChanged.emit(step);
    this.activatedSteps[step] = true;

    if (step === PoolCreationWizardStep.Review) {
      Object.values(PoolCreationWizardStep).forEach((stepKey) => {
        this.activatedSteps[stepKey] = true;
      });
    }
  }

  goToLastStep(): void {
    this.stepper().selectedIndex = this.stepper().steps.length - 1;
    this.cdr.markForCheck();
  }

  private listenForStartOver(): void {
    this.store.startOver$.pipe(untilDestroyed(this)).subscribe(() => {
      this.stepper().selectedIndex = 0;
      this.activatedSteps = {};
    });
  }

  private connectToStore(): void {
    this.store.initialize();

    this.store.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.state = state;
      this.cdr.markForCheck();
    });

    this.poolManagerValidation.getTopLevelWarningsForEachStep().pipe(untilDestroyed(this)).subscribe((warnings) => {
      this.topLevelWarningsForEachStep = warnings;
    });

    this.poolManagerValidation.getTopLevelErrorsForEachStep().pipe(untilDestroyed(this)).subscribe((warnings) => {
      this.topLevelErrorsForEachStep = warnings;
    });
  }

  private checkEnclosureStepAvailability(): void {
    combineLatest([
      this.store.hasMultipleEnclosuresAfterFirstStep$,
      this.systemStore$.select(selectHasEnclosureSupport),
    ]).pipe(
      map(([hasMultipleEnclosures, hasEnclosureSupport]) => hasMultipleEnclosures && hasEnclosureSupport),
      untilDestroyed(this),
    ).subscribe((result) => {
      this.hasEnclosureStep = result;
      if (result) {
        setTimeout(() => this.stepper().selectedIndex = getPoolCreationWizardStepIndex[this.activeStep]);
      }
      this.cdr.markForCheck();
    });
  }

  private prepareCreatePayload(): CreatePool {
    const payload: CreatePool = {
      name: this.state.name,
      topology: topologyToPayload(this.state.topology),
      allow_duplicate_serials: this.state.diskSettings.allowNonUniqueSerialDisks,
      encryption: this.hasSoftwareEncryption,
    };

    if (this.state.encryption) {
      payload.encryption_options = {
        generate_key: true,
        algorithm: this.state.encryption,
      };
    }

    if (this.state.encryptionType === EncryptionType.Sed) {
      payload.all_sed = true;
    }

    return payload;
  }

  private updatePool(): void {
    const payload: UpdatePool = {
      topology: topologyToPayload(this.state.topology),
      allow_duplicate_serials: this.state.diskSettings.allowNonUniqueSerialDisks,
    };

    this.dialogService.jobDialog(
      this.api.job('pool.update', [this.existingPool.id, payload]),
      { title: this.translate.instant('Update Pool') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Pool updated successfully'));
        this.router.navigate(['/storage']);
      });
  }

  protected submit(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Warning'),
      message: this.translate.instant('The contents of all added disks will be erased.'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        if (!this.existingPool) {
          this.createPool();
          return;
        }
        this.updatePool();
      },
    });
  }
}
