import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Observable, forkJoin, map, of, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextImport } from 'app/helptext/storage/volumes/volume-import-wizard';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DiskDetailsResponse } from 'app/interfaces/disk.interface';
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

  importablePools: {
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
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.currentStep.set('loading');

    forkJoin([
      this.api.job('pool.import_find'),
      this.api.call('disk.details'),
      this.api.call('system.advanced.sed_global_password'),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ([importablePoolFindJob, diskDetails, sedGlobalPassword]: [
        Job<PoolFindResult[]>,
        DiskDetailsResponse,
        string,
      ]) => {
        this.isLoading.set(false);

        if (importablePoolFindJob.state !== JobState.Success) {
          return;
        }

        const result: PoolFindResult[] = importablePoolFindJob.result;
        this.importablePools = result.map((pool) => ({
          name: pool.name,
          guid: pool.guid,
        }));

        const opts = result.map((pool) => ({
          label: `${pool.name} | ${pool.guid}`,
          value: pool.guid,
        } as Option));
        this.pool.options = of(opts);

        this.globalSedPassword.set(sedGlobalPassword || '');

        const allDisks = [...diskDetails.used, ...diskDetails.unused];
        const lockedDisks = filterLockedSedDisks(allDisks);
        this.lockedSedDisks.set(lockedDisks);

        if (lockedDisks.length > 0) {
          this.currentStep.set('locked-sed');
        } else {
          this.currentStep.set('import');
        }
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected onLockedSedSkip(): void {
    this.currentStep.set('import');
  }

  protected onLockedSedUnlock(): void {
    this.currentStep.set('unlock-sed');
  }

  protected onUnlockSkip(): void {
    this.currentStep.set('import');
  }

  protected onUnlockSuccess(): void {
    this.loadData();
  }

  protected onSubmit(): void {
    this.dialogService.jobDialog(
      this.api.job('pool.import_pool', [{ guid: this.formGroup.getRawValue().guid }]),
      { title: this.translate.instant('Importing Pool') },
    )
      .afterClosed()
      .pipe(
        switchMap(() => this.checkIfUnlockNeeded()),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([datasets, shouldTryUnlocking]) => {
        this.slideInRef.close({ response: true });
        this.snackbar.success(this.translate.instant('Pool imported successfully.'));
        if (shouldTryUnlocking) {
          this.router.navigate(['/datasets', datasets[0].id, 'unlock']);
        }
      });
  }

  private checkIfUnlockNeeded(): Observable<[Dataset[], boolean]> {
    const selectedPool = this.importablePools.find((pool) => pool.guid === this.formGroup.value.guid);
    return this.api.call(
      'pool.dataset.query',
      [[['name', '=', selectedPool?.name]]],
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
