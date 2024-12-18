import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, output, viewChild,
} from '@angular/core';
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
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import {
  DownloadKeyDialogComponent, DownloadKeyDialogParams,
} from 'app/pages/storage/modules/pool-manager/components/download-key-dialog/download-key-dialog.component';
import { PoolCreationWizardStep, getPoolCreationWizardStepIndex } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import { PoolManagerValidationService } from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import { PoolManagerState, PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { topologyToPayload } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';
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
  standalone: true,
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
  protected existingPool: Pool = null;

  readonly stepChanged = output<PoolCreationWizardStep>();

  private readonly stepper = viewChild('stepper', { read: MatStepper });

  isLoading$ = combineLatest([this.store.isLoading$, this.addVdevsStore.isLoading$]).pipe(
    map(([storeLoading, secondaryLoading]) => storeLoading || secondaryLoading),
  );

  usesDraidLayout$ = this.store.usesDraidLayout$;

  activeStep: PoolCreationWizardStep = PoolCreationWizardStep.General;
  hasEnclosureStep = false;
  state: PoolManagerState;
  topLevelWarningsForEachStep: Partial<{ [key in PoolCreationWizardStep]: string | null }>;
  topLevelErrorsForEachStep: Partial<{ [key in PoolCreationWizardStep]: string | null }>;
  activatedSteps: Partial<{ [key in PoolCreationWizardStep]: boolean }> = {};

  protected readonly PoolCreationWizardStep = PoolCreationWizardStep;

  get hasEncryption(): boolean {
    return Boolean(this.state.encryption);
  }

  constructor(
    private store: PoolManagerStore,
    private systemStore$: Store<AppState>,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private router: Router,
    private snackbar: SnackbarService,
    private poolManagerValidation: PoolManagerValidationService,
    private addVdevsStore: AddVdevsStore,
    private dialogService: DialogService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
  ) {}

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

  loadExistingPoolDetails(): void {
    this.addVdevsStore.pool$.pipe(
      filter(Boolean),
      tap((pool) => {
        this.existingPool = pool;
        this.cdr.markForCheck();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  getTopLevelWarningForStep(step: PoolCreationWizardStep): string | null {
    return this.topLevelWarningsForEachStep?.[step];
  }

  getTopLevelErrorForStep(step: PoolCreationWizardStep): string | null {
    return this.topLevelErrorsForEachStep?.[step];
  }

  getWasStepActivated(step: PoolCreationWizardStep): boolean {
    return Boolean(this.activatedSteps?.[step]);
  }

  createPool(): void {
    const payload = this.prepareCreatePayload();

    this.dialogService.jobDialog(
      this.api.job('pool.create', [payload]),
      { title: this.translate.instant('Create Pool') },
    )
      .afterClosed()
      .pipe(
        switchMap((job) => {
          if (!this.hasEncryption) {
            return of(null);
          }

          return this.matDialog.open<DownloadKeyDialogComponent, DownloadKeyDialogParams>(DownloadKeyDialogComponent, {
            disableClose: true,
            data: job.result,
          }).afterClosed();
        }),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
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

  listenForStartOver(): void {
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
      encryption: this.hasEncryption,
    };

    if (this.state.encryption) {
      payload.encryption_options = {
        generate_key: true,
        algorithm: this.state.encryption,
      };
    }

    return payload;
  }

  updatePool(): void {
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
        this.errorHandler.catchError(),
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
