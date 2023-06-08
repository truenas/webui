import { StepperSelectionEvent } from '@angular/cdk/stepper';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { Job } from 'app/interfaces/job.interface';
import {
  CreatePool, Pool,
} from 'app/interfaces/pool.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  DownloadKeyDialogComponent, DownloadKeyDialogParams,
} from 'app/pages/storage/modules/pool-manager/components/download-key-dialog/download-key-dialog.component';
import { PoolManagerState, PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { topologyToPayload } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';
import { SystemGeneralService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager-wizard',
  templateUrl: './pool-manager-wizard.component.html',
  styleUrls: ['./pool-manager-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerWizardComponent implements OnInit {
  @ViewChild('stepper') stepper: MatStepper;
  isLoading$ = this.store.isLoading$;

  hasEnclosureStep$ = combineLatest([
    this.store.hasMultipleEnclosuresInAllowedDisks$,
    this.systemService.isEnterprise$,
  ]).pipe(
    map(([hasMultipleEnclosures, isEnterprise]) => hasMultipleEnclosures && isEnterprise),
  );

  state: PoolManagerState;

  isCurrentFormValid = false;
  hasDataVdevs = false;

  constructor(
    private store: PoolManagerStore,
    private systemService: SystemGeneralService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private router: Router,
    private snackbar: SnackbarService,
  ) {}

  get hasEncryption(): boolean {
    return Boolean(this.state.encryption);
  }

  ngOnInit(): void {
    this.connectToStore();
  }

  stepChanged({ selectedIndex }: StepperSelectionEvent): void {
    if (selectedIndex === 2) {
      this.store.topology$.pipe(map((topology) => topology[VdevType.Data].vdevs.length > 0))
        .pipe(untilDestroyed(this))
        .subscribe((result) => {
          this.hasDataVdevs = result;
          this.stepValidityChanged(result);
        });
    }
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

  goToLastStep(): void {
    this.stepper.selectedIndex = this.stepper.steps.length - 1;
    this.cdr.markForCheck();
  }

  private connectToStore(): void {
    this.store.initialize();

    this.store.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.state = state;
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

  stepValidityChanged(isValid: boolean): void {
    this.isCurrentFormValid = isValid;
  }
}
