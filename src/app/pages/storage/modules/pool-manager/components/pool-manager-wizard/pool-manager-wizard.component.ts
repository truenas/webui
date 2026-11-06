import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, effect, OnDestroy, OnInit, output,
  viewChild, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent, TnDialog, TnStepComponent, TnStepperComponent,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { StepActivationDirective } from 'app/directives/step-activation.directive';
import {
  CreatePool, toPoolCreateArgs, toPoolUpdateArgs, UpdatePool,
} from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
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
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
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

@Component({
  selector: 'ix-pool-manager-wizard',
  templateUrl: './pool-manager-wizard.component.html',
  styleUrls: ['./pool-manager-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    FakeProgressBarComponent,
    ReactiveFormsModule,
    TnStepperComponent,
    TnStepComponent,
    StepActivationDirective,
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
  ],
  providers: [
    PoolManagerValidationService,
  ],
})
export class PoolManagerWizardComponent implements OnInit, OnDestroy {
  private store = inject(PoolManagerStore);
  private systemStore$ = inject<Store<AppState>>(Store);
  private tnDialog = inject(TnDialog);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private poolManagerValidation = inject(PoolManagerValidationService);
  private addVdevsStore = inject(AddVdevsStore);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  private generalStep = viewChild<GeneralWizardStepComponent>('generalStep');
  private enclosureStep = viewChild<EnclosureWizardStepComponent>('enclosureStep');

  readonly stepChanged = output<PoolCreationWizardStep>();

  private readonly stepper = viewChild.required(TnStepperComponent);

  protected existingPool = this.addVdevsStore.pool;
  protected topology = this.store.topology;
  protected isLoading = computed(() => this.store.isLoading() || this.addVdevsStore.isLoading());

  private hasEnclosureSupport = this.systemStore$.selectSignal(selectHasEnclosureSupport);
  protected hasEnclosureStep = computed(() => {
    return this.store.hasMultipleEnclosuresAfterFirstStep() && this.hasEnclosureSupport();
  });

  activeStep: PoolCreationWizardStep = PoolCreationWizardStep.General;
  activatedSteps: Partial<Record<PoolCreationWizardStep, boolean>> = {};

  protected readonly PoolCreationWizardStep = PoolCreationWizardStep;

  constructor() {
    // The Enclosure step appears above the current one, so keep the stepper on the step the user was on.
    effect(() => {
      if (this.hasEnclosureStep()) {
        setTimeout(() => this.stepper().selectedIndex.set(getPoolCreationWizardStepIndex[this.activeStep]));
      }
    });
  }

  get hasSoftwareEncryption(): boolean {
    return this.store.encryptionType() === EncryptionType.Software;
  }

  get isFormDirty(): boolean {
    return this.generalStep()?.form?.dirty || this.enclosureStep()?.form?.dirty;
  }

  ngOnInit(): void {
    this.store.initialize();
    this.listenForStartOver();
  }

  ngOnDestroy(): void {
    this.addVdevsStore.resetStoreToInitialState();
    this.store.resetStoreToInitialState();
  }

  getTopLevelWarningForStep(step: PoolCreationWizardStep): string | null | undefined {
    return this.poolManagerValidation.topLevelWarningsForEachStep()[step];
  }

  getTopLevelErrorForStep(step: PoolCreationWizardStep): string {
    return this.poolManagerValidation.topLevelErrorsForEachStep()[step] || '';
  }

  getWasStepActivated(step: PoolCreationWizardStep): boolean {
    return Boolean(this.activatedSteps?.[step]);
  }

  // Mirrors mat-stepper's `showError && hasError && !isCurrentStep`: an error indicator is shown only for a
  // step that has been activated and is not the one currently being viewed. tn-stepper renders [hasError]
  // unconditionally, so without the active-step guard the first step would flash its error on open.
  isStepErrorVisible(step: PoolCreationWizardStep): boolean {
    return Boolean(this.getTopLevelErrorForStep(step))
      && this.getWasStepActivated(step)
      && this.activeStep !== step;
  }

  createPool(): void {
    const payload = this.prepareCreatePayload();

    // If SED encryption is selected and a password was entered, update global SED password first
    const sedPassword = this.store.sedPassword();
    const sedPasswordUpdate$ = this.store.encryptionType() === EncryptionType.Sed && sedPassword
      ? this.api.call('system.advanced.update', [{ sed_passwd: sedPassword }])
      : of(null);

    sedPasswordUpdate$.pipe(
      switchMap(() => {
        return this.dialogService.jobDialog(
          this.api.job('pool.create', [toPoolCreateArgs(payload)]),
          { title: this.translate.instant('Create Pool') },
        ).afterClosed();
      }),
      switchMap((job) => {
        if (!this.hasSoftwareEncryption) {
          return of(null);
        }

        return this.tnDialog.open<DownloadKeyDialog, DownloadKeyDialogParams>(DownloadKeyDialog, {
          disableClose: true,
          data: job.result,
        }).closed;
      }),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.generalStep()?.form?.markAsPristine();
      this.enclosureStep()?.form?.markAsPristine();
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
    this.stepper().selectedIndex.set(this.stepper().steps().length - 1);
    this.cdr.markForCheck();
  }

  private listenForStartOver(): void {
    this.store.startOver$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.stepper().selectedIndex.set(0);
      this.activatedSteps = {};
      this.cdr.markForCheck();
    });
  }

  private prepareCreatePayload(): CreatePool {
    const payload: CreatePool = {
      name: this.store.name(),
      topology: topologyToPayload(this.store.topology()),
      allow_duplicate_serials: this.store.diskSettings().allowNonUniqueSerialDisks,
      encryption: this.hasSoftwareEncryption,
    };

    if (this.hasSoftwareEncryption) {
      payload.encryption_options = {
        generate_key: true,
      };
    }

    if (this.store.encryptionType() === EncryptionType.Sed) {
      payload.all_sed = true;
    }

    // Only offered without a SUPPORT entitlement (see review-wizard-step), so forceTopology
    // is never true on a supported system, where middleware rejects it outright.
    if (this.store.forceTopology()) {
      payload.force_topology = true;
    }

    return payload;
  }

  private updatePool(): void {
    const payload: UpdatePool = {
      topology: topologyToPayload(this.store.topology()),
      allow_duplicate_serials: this.store.diskSettings().allowNonUniqueSerialDisks,
    };

    if (this.store.forceTopology()) {
      payload.force_topology = true;
    }

    this.dialogService.jobDialog(
      this.api.job('pool.update', [this.existingPool().id, toPoolUpdateArgs(payload)]),
      { title: this.translate.instant('Update Pool') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        if (!this.existingPool()) {
          this.createPool();
          return;
        }
        this.updatePool();
      },
    });
  }
}
