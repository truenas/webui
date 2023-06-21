import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Job } from 'app/interfaces/job.interface';
import {
  CreatePool, Pool,
} from 'app/interfaces/pool.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  DownloadKeyDialogComponent, DownloadKeyDialogParams,
} from 'app/pages/storage/modules/pool-manager/components/download-key-dialog/download-key-dialog.component';
import { PoolCreationSeverity } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-severity';
import { PoolCreationWizardRequiredStep, PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import { PoolCreationError } from 'app/pages/storage/modules/pool-manager/interfaces/pool-creation-error';
import { PoolManagerState, PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { topologyToPayload } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';
import { AppState } from 'app/store';
import { waitForSystemFeatures } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager-wizard',
  templateUrl: './pool-manager-wizard.component.html',
  styleUrls: ['./pool-manager-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerWizardComponent implements OnInit {
  @Output() stepChanged = new EventEmitter<PoolCreationWizardStep>();

  @ViewChild('stepper') stepper: MatStepper;

  isLoading$ = this.store.isLoading$;

  activeStep: PoolCreationWizardStep;
  hasEnclosureStep = false;

  state: PoolManagerState;
  poolCreationErrors: PoolCreationError[];

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
  ) {}

  ngOnInit(): void {
    this.connectToStore();
    this.checkEnclosureStepAvailability();
  }

  getPoolCreationStepErrors(step: PoolCreationWizardStep): PoolCreationError[] {
    return this.poolCreationErrors.filter(
      (item) => item.step === step && item.severity === PoolCreationSeverity.Error,
    );
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
          return of(undefined);
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
  }

  goToLastStep(): void {
    this.stepper.selectedIndex = this.stepper.steps.length - 1;
    this.cdr.markForCheck();
  }

  stepValidityChanged(step: PoolCreationWizardRequiredStep, isValid: boolean): void {
    this.store.updateRequiredStepValidity(step, { valid: isValid });
  }

  private connectToStore(): void {
    this.store.initialize();

    this.store.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.state = state;
      this.cdr.markForCheck();
    });

    this.store.poolCreationErrors$.pipe(untilDestroyed(this)).subscribe((data) => {
      this.poolCreationErrors = data;
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
      this.store.updateRequiredStepValidity(PoolCreationWizardStep.EnclosureOptions, { required: result });
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
}
