import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
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
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-import-pool',
  templateUrl: './import-pool.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  protected readonly requiredRoles = [Role.FullAdmin];

  readonly helptext = helptextImport;
  isLoading = false;
  importablePools: {
    name: string;
    guid: string;
  }[] = [];

  formGroup = this.fb.group({
    guid: ['' as string, Validators.required],
  });

  pool = {
    fcName: 'guid',
    label: helptextImport.guid_placeholder,
    tooltip: helptextImport.guid_tooltip,
    options: of<Option[]>([]),
  };

  constructor(
    private fb: FormBuilder,
    private slideInRef: SlideInRef<ImportPoolComponent>,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private snackbar: SnackbarService,
    private loader: AppLoaderService,
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.api.job('pool.import_find').pipe(untilDestroyed(this)).subscribe({
      next: (importablePoolFindJob) => {
        if (importablePoolFindJob.state !== JobState.Success) {
          return;
        }

        this.isLoading = false;
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
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.cdr.markForCheck();

        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }

  onSubmit(): void {
    this.dialogService.jobDialog(
      this.api.job('pool.import_pool', [{ guid: this.formGroup.value.guid }]),
      { title: this.translate.instant('Importing Pool') },
    )
      .afterClosed()
      .pipe(
        switchMap(() => this.checkIfUnlockNeeded()),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(([datasets, shouldTryUnlocking]) => {
        this.slideInRef.close(true);
        this.snackbar.success(this.translate.instant('Pool imported successfully.'));
        if (shouldTryUnlocking) {
          this.router.navigate(['/datasets', datasets[0].id, 'unlock']);
        }
      });
  }

  checkIfUnlockNeeded(): Observable<[Dataset[], boolean]> {
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
