import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { Job } from 'app/interfaces/job.interface';
import {
  CreatePool, Pool, UpdatePool,
} from 'app/interfaces/pool.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import {
  DownloadKeyDialogComponent, DownloadKeyDialogParams,
} from 'app/pages/storage/modules/pool-manager/components/download-key-dialog/download-key-dialog.component';
import { PoolCreationWizardStep, getPoolCreationWizardStepIndex } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import { PoolManagerValidationService } from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import { PoolManagerState, PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { topologyToPayload } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';
import { DialogService } from 'app/services/dialog.service';
import { AppState } from 'app/store';
import { waitForSystemFeatures } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager-wizard',
  templateUrl: './pool-manager-wizard.component.html',
  styleUrls: ['./pool-manager-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerWizardComponent implements OnInit, OnDestroy {
  protected existingPool: Pool = null;
  @Output() stepChanged = new EventEmitter<PoolCreationWizardStep>();

  @ViewChild('stepper') stepper: MatStepper;

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

  get alreadyHasSpare(): boolean {
    return Boolean(this.existingPool?.topology?.spare?.length);
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
    private route: ActivatedRoute,
    private addVdevsStore: AddVdevsStore,
    private dialogService: DialogService,
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
      tap((pool) => {
        if (pool) {
          this.existingPool = pool;
          this.cdr.markForCheck();
        }
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

    const dialogRef = this.matDialog.open(EntityJobComponent, {
      disableClose: true,
      data: {
        title: this.translate.instant('Create Pool'),
      },
    });
    dialogRef.componentInstance.setCall('pool.create', [payload]);
    dialogRef.componentInstance.success.pipe(
      switchMap((job: Job<Pool>) => {
        if (!this.hasEncryption) {
          return of(null);
        }

        return this.matDialog.open<DownloadKeyDialogComponent, DownloadKeyDialogParams>(DownloadKeyDialogComponent, {
          disableClose: true,
          data: job.result,
        }).afterClosed();
      }),
      untilDestroyed(this),
    )
      .subscribe(() => {
        dialogRef.close(false);
        this.snackbar.success(this.translate.instant('Pool created successfully'));
        this.router.navigate(['/storage']);
      });

    dialogRef.componentInstance.submit();
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
    this.stepper.selectedIndex = this.stepper.steps.length - 1;
    this.cdr.markForCheck();
  }

  listenForStartOver(): void {
    this.store.startOver$.pipe(untilDestroyed(this)).subscribe(() => {
      this.stepper.selectedIndex = 0;
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
      this.systemStore$.pipe(waitForSystemFeatures, map((features) => features.enclosure)),
    ]).pipe(
      map(([hasMultipleEnclosures, hasEnclosureSupport]) => hasMultipleEnclosures && hasEnclosureSupport),
      untilDestroyed(this),
    ).subscribe((result) => {
      this.hasEnclosureStep = result;
      if (result) {
        setTimeout(() => this.stepper.selectedIndex = getPoolCreationWizardStepIndex[this.activeStep]);
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

    const dialogRef = this.matDialog.open(EntityJobComponent, {
      disableClose: true,
      data: {
        title: this.translate.instant('Update Pool'),
      },
    });
    dialogRef.componentInstance.setCall('pool.update', [this.existingPool.id, payload]);
    dialogRef.componentInstance.success.pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      dialogRef.close(false);
      this.snackbar.success(this.translate.instant('Pool updated successfully'));
      this.router.navigate(['/storage']);
    });

    dialogRef.componentInstance.submit();
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
          this.createPool(); return;
        }
        this.updatePool();
      },
    });
  }
}
