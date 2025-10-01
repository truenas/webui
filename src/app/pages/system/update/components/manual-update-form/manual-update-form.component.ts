import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Validators, ReactiveFormsModule, NonNullableFormBuilder, FormControl, FormGroup,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  finalize, noop, Observable, of,
} from 'rxjs';
import {
  filter, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { isFailedJobError } from 'app/helpers/api.helper';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemUpdate as helptext } from 'app/helptext/system/update';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { systemManualUpdateFormElements } from 'app/pages/system/update/components/manual-update-form/manual-update-form.elements';
import { updateAgainCode } from 'app/pages/system/update/utils/update-again-code.constant';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { UploadOptions, UploadService } from 'app/services/upload.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { updateRebootAfterManualUpdate } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { selectIsEnterprise, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-manual-update-form',
  templateUrl: './manual-update-form.component.html',
  styleUrls: ['manual-update-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatCardContent,
    MatProgressBar,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxFileInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ManualUpdateFormComponent implements OnInit {
  private dialogService = inject(DialogService);
  protected router = inject(Router);
  systemService = inject(SystemGeneralService);
  private formBuilder = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  private upload = inject(UploadService);
  private window = inject<Window>(WINDOW);

  protected readonly requiredRoles = [Role.SystemUpdateWrite];
  protected readonly searchableElements = systemManualUpdateFormElements;

  protected isFormLoading = signal(false);

  form = this.formBuilder.group({
    filelocation: ['', Validators.required],
    updateFile: [null as FileList | null],
    rebootAfterManualUpdate: [false],
  }) as FormGroup<{
    filelocation?: FormControl<string | null>;
    updateFile: FormControl<FileList | null>;
    rebootAfterManualUpdate: FormControl<boolean>;
  }>;

  readonly helptext = helptext;
  currentVersion = '';
  fileLocationOptions$: Observable<Option[]>;

  isHaLicensed = false;
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  ngOnInit(): void {
    this.checkHaLicenseAndUpdateStatus();
    this.getVersionNoFromSysInfo();
    this.setPoolOptions();
    this.getUserPrefs();
  }

  private getUserPrefs(): void {
    this.store$.pipe(waitForPreferences).pipe(
      tap((userPrefs) => {
        if (userPrefs.rebootAfterManualUpdate === undefined) {
          userPrefs.rebootAfterManualUpdate = false;
        }
        this.form.controls.rebootAfterManualUpdate.setValue(userPrefs.rebootAfterManualUpdate);
      }),
      untilDestroyed(this),
    ).subscribe(noop);
  }

  private getVersionNoFromSysInfo(): void {
    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((sysInfo) => {
      this.currentVersion = sysInfo.version;
    });
  }

  private setPoolOptions(): void {
    this.api.call('pool.query').pipe(untilDestroyed(this)).subscribe((pools) => {
      if (!pools) {
        return;
      }
      const options = [{ label: this.translate.instant('Memory device'), value: ':temp:' }];
      pools.forEach((pool) => {
        options.push({
          label: ignoreTranslation('/mnt/' + pool.name),
          value: '/mnt/' + pool.name,
        });
      });
      this.fileLocationOptions$ = of(options);
    });
  }

  private checkHaLicenseAndUpdateStatus(): void {
    this.store$.select(selectIsEnterprise).pipe(untilDestroyed(this)).subscribe((isEnterprise) => {
      if (isEnterprise) {
        this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
          this.isHaLicensed = isHaLicensed;
          this.checkForUpdateRunning();

          if (this.isHaLicensed) {
            this.form.removeControl('filelocation');
          }
        });
      }
    });
  }

  private checkForUpdateRunning(): void {
    this.api.call('core.get_jobs', [[['method', '=', 'failover.upgrade'], ['state', '=', JobState.Running]]])
      .pipe(untilDestroyed(this)).subscribe({
        next: (jobs) => {
          if (jobs && jobs.length > 0) {
            this.showRunningUpdate(jobs[0].id);
          }
        },
        error: (err: unknown) => {
          console.error(err);
        },
      });
  }

  // TODO: Same code as in update-actions-card
  showRunningUpdate(jobId: number): void {
    const job$ = this.store$.pipe(
      select(selectJob(jobId)),
      observeJob(),
    ) as Observable<Job<ApiJobMethod>>;

    this.dialogService.jobDialog(
      job$,
      {
        title: this.translate.instant('Update'),
        canMinimize: true,
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.router.navigate(['/system-tasks/restart'], { skipLocationChange: true });
      });
  }

  onSubmit(): void {
    this.isFormLoading.set(true);
    const value = this.form.getRawValue();
    value.filelocation = value.filelocation === ':temp:' ? null : value.filelocation;
    this.store$.dispatch(updateRebootAfterManualUpdate({
      rebootAfterManualUpdate: value.rebootAfterManualUpdate,
    }));
    this.systemService.updateRunningNoticeSent.emit();
    this.setupAndOpenUpdateJobDialog(value.updateFile, value.filelocation);
  }

  private setupAndOpenUpdateJobDialog(files: FileList, fileLocation: string): void {
    if (!files.length) {
      return;
    }

    const params: UploadOptions = this.isHaLicensed
      ? {
          method: 'failover.upgrade',
          file: files[0],
        }
      : {
          method: 'update.file',
          params: [{ destination: fileLocation }],
          file: files[0],
        };

    const job$ = this.upload.uploadAsJob(params);
    this.dialogService
      .jobDialog(job$, { title: this.translate.instant(helptext.manualUpdateAction) })
      .afterClosed()
      .pipe(
        finalize(() => {
          this.isFormLoading.set(false);
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => this.handleUpdateSuccess(),
        error: (error: unknown) => this.handleUpdateFailure(error),
      });
  }

  finishNonHaUpdate(): void {
    // Mark that update completed successfully - reload page after restart to get latest UI
    if (this.form.value.rebootAfterManualUpdate) {
      this.window.sessionStorage.setItem('updateCompleted', 'true');
      this.router.navigate(['/system-tasks/restart'], { skipLocationChange: true });
    } else {
      this.dialogService.confirm({
        title: this.translate.instant('Restart'),
        message: this.translate.instant(helptext.rebootAfterManualUpdate.manualRebootMessage),
      }).pipe(
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe(() => {
        this.window.sessionStorage.setItem('updateCompleted', 'true');
        this.router.navigate(['/system-tasks/restart'], { skipLocationChange: true });
      });
    }
  }

  finishHaUpdate(): void {
    this.dialogService.closeAllDialogs();
    this.systemService.updateDone(); // Send 'finished' signal to topbar
    this.router.navigate(['/']);
    this.dialogService.confirm({
      title: this.translate.instant(helptext.haUpdate.completeTitle),
      message: this.translate.instant(helptext.haUpdate.completeMessage),
      hideCheckbox: true,
      buttonText: this.translate.instant(helptext.haUpdate.completeAction),
      hideCancel: true,
    }).pipe(untilDestroyed(this)).subscribe();
  }

  private handleUpdateSuccess(): void {
    if (this.isHaLicensed) {
      this.finishHaUpdate();
    } else {
      this.finishNonHaUpdate();
    }
  }

  handleUpdateFailure = (failure: unknown): void => {
    this.isFormLoading.set(false);

    if (isFailedJobError(failure) && failure.job.error?.includes(updateAgainCode)) {
      this.dialogService.confirm({
        title: this.translate.instant(helptext.continueDialogTitle),
        message: ignoreTranslation(failure.job.error.replace(updateAgainCode, '')),
        buttonText: this.translate.instant(helptext.continueDialogAction),
      }).pipe(
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe(() => {
        this.resumeUpdateAfterFailure();
      });
      return;
    }
    this.errorHandler.showErrorModal(failure);
  };

  private resumeUpdateAfterFailure(): void {
    const job$: Observable<Job> = this.isHaLicensed
      ? this.api.job('failover.upgrade', [{ resume: true, resume_manual: true }])
      : this.api.job('update.file', [{ resume: true }]);

    this.dialogService
      .jobDialog(job$, { title: this.translate.instant(helptext.manualUpdateAction) })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => this.handleUpdateSuccess(),
        error: (error: unknown) => this.handleUpdateFailure(error),
      });
  }
}
