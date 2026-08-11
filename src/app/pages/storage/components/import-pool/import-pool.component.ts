import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnFormFieldComponent, TnFormSectionComponent, TnSelectComponent, TnSpinnerComponent,
} from '@truenas/ui-components';
import {
  Observable, forkJoin, last, map, of, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { helptextImport } from 'app/helptext/storage/volumes/volume-import-wizard';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Option } from 'app/interfaces/option.interface';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { tnSelectLabels } from 'app/modules/forms/ix-forms/constants/tn-select-labels.constant';
import { optionTestIdByLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { LockedSedDisksComponent } from './locked-sed-disks/locked-sed-disks.component';
import { UnlockSedDisksComponent } from './unlock-sed-disks/unlock-sed-disks.component';
import { filterLockedSedDisks, LockedSedDisk } from './utils/sed-disk.utils';

type ImportStep = 'loading' | 'locked-sed' | 'unlock-sed' | 'import';

@Component({
  selector: 'ix-import-pool',
  templateUrl: './import-pool.component.html',
  styleUrls: ['./import-pool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnSpinnerComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    LockedSedDisksComponent,
    UnlockSedDisksComponent,
  ],
})
export class ImportPoolComponent extends SidePanelForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private loader = inject(LoaderService);
  private destroyRef = inject(DestroyRef);

  protected readonly tnSelectLabels = tnSelectLabels;

  protected readonly requiredRoles = [Role.PoolWrite];

  protected readonly helptext = helptextImport;
  protected isLoading = signal(false);
  protected currentStep = signal<ImportStep>('loading');
  protected lockedSedDisks = signal<LockedSedDisk[]>([]);
  protected globalSedPassword = signal('');

  private importablePools: {
    name: string;
    guid: string;
  }[] = [];

  readonly form = this.fb.nonNullable.group({
    guid: ['' as string, Validators.required],
  });

  /**
   * Required by {@link SidePanelForm}, but inert here: `PoolsDashboardComponent` opens this form
   * `footerless`, so the panel renders no Save action to read it and the template carries its own
   * submit button. Wire the footer to it before deleting the in-template one, not the other way
   * round — the multi-step flow (locked SED -> unlock -> import) has steps with no submit at all.
   */
  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  protected readonly poolLabel = helptextImport.poolLabel;
  protected readonly poolOptions = signal<Option[]>([]);

  /**
   * The option label is `<name> | <guid>` while the value is the bare guid, so the
   * test id is pinned to the label to keep the pre-migration `option-guid-<name>-<guid>`.
   */
  protected readonly optionTestIdByLabel = optionTestIdByLabel;

  private readonly unlockSedDisks = viewChild(UnlockSedDisksComponent);

  ngOnInit(): void {
    this.checkForLockedDisks();
  }

  /**
   * The unlock-SED step edits a form owned by the child component, which the inherited guard
   * (which only sees `form`) can't see — so a half-typed SED password would be discarded silently.
   */
  override hasUnsavedChanges(): boolean {
    return super.hasUnsavedChanges() || Boolean(this.unlockSedDisks()?.hasUnsavedChanges());
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

    this.api.job('pool.import_find').pipe(
      observeJob(),
      last(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (importablePoolFindJob) => {
        this.isLoading.set(false);

        const result: PoolFindResult[] = importablePoolFindJob.result || [];
        this.importablePools = result.map((pool) => ({
          name: pool.name,
          guid: pool.guid,
        }));

        this.poolOptions.set(result.map((pool) => ({
          label: `${pool.name} | ${pool.guid}`,
          value: pool.guid,
        } as Option)));

        this.currentStep.set('import');
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
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
      this.api.job('pool.import_pool', [{ guid: this.form.getRawValue().guid }]),
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
          this.close(true);
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

  private checkIfUnlockNeeded(): Observable<[Dataset[], boolean]> {
    const selectedPool = this.importablePools.find((pool) => pool.guid === this.form.value.guid);
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
