import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Router } from '@angular/router';
import {
  UntilDestroy, untilDestroyed,
} from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Observable, map, of, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextImport } from 'app/helptext/storage/volumes/volume-import-wizard';
import { Dataset } from 'app/interfaces/dataset.interface';
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

@UntilDestroy()
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
  slideInRef = inject<SlideInRef<undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.PoolWrite];

  readonly helptext = helptextImport;
  protected isLoading = signal(false);
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
    this.isLoading.set(true);
    this.api.job('pool.import_find').pipe(untilDestroyed(this)).subscribe({
      next: (importablePoolFindJob) => {
        if (importablePoolFindJob.state !== JobState.Success) {
          return;
        }

        this.isLoading.set(false);
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
      },
      error: (error: unknown) => {
        this.isLoading.set(false);

        this.errorHandler.showErrorModal(error);
      },
    });
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
        untilDestroyed(this),
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
    return this.api.call(
      'pool.dataset.query',
      [[['name', '=', this.importablePools.find((importablePool) => importablePool.guid === this.formGroup.value.guid).name]]],
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
