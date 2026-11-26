import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Observable, catchError, forkJoin, last, map, of, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Role } from 'app/enums/role.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { helptextImport } from 'app/helptext/storage/volumes/volume-import-wizard';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { LockedSedDisksComponent } from './locked-sed-disks/locked-sed-disks.component';
import { UnlockSedDisksComponent } from './unlock-sed-disks/unlock-sed-disks.component';
import { filterLockedSedDisks, LockedSedDisk } from './utils/sed-disk.utils';

type ImportStep = 'loading' | 'locked-sed' | 'unlock-sed' | 'import';

@Component({
  selector: 'ix-import-pool',
  templateUrl: './import-pool.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    LockedSedDisksComponent,
    UnlockSedDisksComponent,
  ],
})
export class ImportPoolComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private loader = inject(LoaderService);
  private destroyRef = inject(DestroyRef);
  slideInRef = inject<SlideInRef<undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.PoolWrite];

  readonly helptext = helptextImport;
  protected isLoading = signal(false);
  protected currentStep = signal<ImportStep>('loading');
  protected lockedSedDisks = signal<LockedSedDisk[]>([]);
  protected globalSedPassword = signal('');

  /**
   * Every pool in the select. `id` is set for a pool that is already configured on the system but
   * offline — typically one whose SED disks were locked at boot and have since been unlocked.
   * `pool.import_find` leaves those out because they are in the database, and `pool.import_pool`
   * would add a second entry for them, so they are imported with `pool.reimport` instead.
   */
  importablePools: {
    id?: number;
    name: string;
    guid: string;
  }[] = [];

  formGroup = this.fb.nonNullable.group({
    guid: ['' as string, Validators.required],
  });

  pool = {
    fcName: 'guid',
    label: helptextImport.poolLabel,
    options: of<Option[]>([]),
  };

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.formGroup.dirty);
    });
  }

  ngOnInit(): void {
    this.checkForLockedDisks();
  }

  private checkForLockedDisks(): void {
    this.isLoading.set(true);
    this.currentStep.set('loading');

    forkJoin([
      this.api.call('disk.details'),
      this.api.call('system.advanced.sed_global_password'),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ([diskDetails, sedGlobalPassword]) => {
        this.isLoading.set(false);
        this.globalSedPassword.set(sedGlobalPassword || '');

        const allDisks = [...diskDetails.used, ...diskDetails.unused];
        const lockedDisks = filterLockedSedDisks(allDisks);
        this.lockedSedDisks.set(lockedDisks);

        if (lockedDisks.length > 0) {
          this.currentStep.set('locked-sed');
        } else {
          this.loadImportablePools();
        }
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private loadImportablePools(): void {
    this.isLoading.set(true);

    forkJoin([
      this.api.job('pool.import_find').pipe(observeJob(), last()),
      this.loadOfflinePools(),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ([importablePoolFindJob, offlinePools]) => {
        this.isLoading.set(false);

        const result: PoolFindResult[] = importablePoolFindJob.result || [];
        this.importablePools = [
          ...result.map((pool) => ({ name: pool.name, guid: pool.guid })),
          ...offlinePools,
        ];

        const offlineSuffix = this.translate.instant('Offline, configured on this system');
        const opts = this.importablePools.map((pool) => ({
          label: pool.id === undefined
            ? `${pool.name} | ${pool.guid}`
            : `${pool.name} | ${pool.guid} (${offlineSuffix})`,
          value: pool.guid,
        } as Option));
        this.pool.options = of(opts);

        this.currentStep.set('import');
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  /**
   * Configured pools that ZFS has not imported. Supplementary: if the query fails, the wizard still
   * lists the pools `pool.import_find` found.
   */
  private loadOfflinePools(): Observable<{ id: number; name: string; guid: string }[]> {
    return this.api.call('pool.query', [[['status', '=', PoolStatus.Offline]]]).pipe(
      map((pools) => pools.map((pool) => ({ id: pool.id, name: pool.name, guid: pool.guid }))),
      catchError((error: unknown) => {
        console.error(error);
        return of([]);
      }),
    );
  }

  protected onLockedSedSkip(): void {
    this.loadImportablePools();
  }

  protected onLockedSedUnlock(): void {
    this.currentStep.set('unlock-sed');
  }

  protected onUnlockSkip(): void {
    this.loadImportablePools();
  }

  protected onUnlockSuccess(): void {
    this.checkForLockedDisks();
  }

  protected onSubmit(): void {
    this.dialogService.jobDialog(
      this.importJob(),
      { title: this.translate.instant('Importing Pool') },
    )
      .afterClosed()
      .pipe(
        switchMap(() => this.checkIfUnlockNeeded()),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ([datasets, shouldTryUnlocking]) => {
          this.slideInRef.close({ response: true });
          this.snackbar.success(this.translate.instant('Pool imported successfully.'));
          if (shouldTryUnlocking) {
            this.router.navigate(['/datasets', datasets[0].id, 'unlock']);
          }
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private importJob(): Observable<Job> {
    const { guid } = this.formGroup.getRawValue();
    const offlinePoolId = this.importablePools.find((pool) => pool.guid === guid)?.id;
    return offlinePoolId === undefined
      ? this.api.job('pool.import_pool', [{ guid }])
      : this.api.job('pool.reimport', [offlinePoolId]);
  }

  private checkIfUnlockNeeded(): Observable<[Dataset[], boolean]> {
    const selectedPool = this.importablePools.find((pool) => pool.guid === this.formGroup.value.guid);
    if (!selectedPool) {
      return of([[], false]);
    }
    return this.api.call(
      'pool.dataset.query',
      [[['name', '=', selectedPool.name]]],
    )
      .pipe(
        this.loader.withLoader(),
        switchMap((poolDatasets): Observable<[Dataset[], boolean]> => {
          if (poolDatasets[0].locked && poolDatasets[0].encryption_root === poolDatasets[0].id) {
            return this.dialogService.confirm({
              title: this.translate.instant('Unlock Pool'),
              message: this.translate.instant('This pool has an encrypted root dataset which is locked. Do you want to unlock it?'),
              hideCheckbox: true,
            }).pipe(
              map((confirmed) => [poolDatasets, confirmed]),
            );
          }
          return of([poolDatasets, false]);
        }),
      );
  }
}
