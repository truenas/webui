import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject, finalize, noop, Observable, of,
} from 'rxjs';
import {
  filter, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
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
import { systemManualUpdateFormElements } from 'app/pages/system/update/components/manual-update-form/manual-update-form.elements';
import { updateAgainCode } from 'app/pages/system/update/utils/update-again-code.constant';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { UploadOptions, UploadService } from 'app/services/upload.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { updateRebootAfterManualUpdate } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-manual-update-form',
  templateUrl: './manual-update-form.component.html',
  styleUrls: ['manual-update-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
    AsyncPipe,
  ],
})
export class ManualUpdateFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = systemManualUpdateFormElements;

  isFormLoading$ = new BehaviorSubject(false);
  form = this.formBuilder.group({
    filelocation: ['', Validators.required],
    updateFile: [null as FileList],
    rebootAfterManualUpdate: [false],
  });

  private apiEndPoint: string;

  readonly helptext = helptext;
  currentVersion = '';
  fileLocationOptions$: Observable<Option[]>;

  isHaLicensed = false;

  constructor(
    private dialogService: DialogService,
    private matDialog: MatDialog,
    protected router: Router,
    public systemService: SystemGeneralService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private authService: AuthService,
    private translate: TranslateService,
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private upload: UploadService,
  ) {
    this.authService.authToken$.pipe(
      tap((token) => {
        this.apiEndPoint = '/_upload?auth_token=' + token;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  ngOnInit(): void {
    this.checkHaLicenseAndUpdateStatus();
    this.getVersionNoFromSysInfo();
    this.setPoolOptions();
    this.getUserPrefs();
  }

  getUserPrefs(): void {
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

  getVersionNoFromSysInfo(): void {
    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((sysInfo) => {
      this.currentVersion = sysInfo.version;
      this.cdr.markForCheck();
    });
  }

  setPoolOptions(): void {
    this.ws.call('pool.query').pipe(untilDestroyed(this)).subscribe((pools) => {
      if (!pools) {
        return;
      }
      const options = [{ label: this.translate.instant('Memory device'), value: ':temp:' }];
      pools.forEach((pool) => {
        options.push({
          label: '/mnt/' + pool.name, value: '/mnt/' + pool.name,
        });
      });
      this.fileLocationOptions$ = of(options);
    });
  }

  checkHaLicenseAndUpdateStatus(): void {
    if (this.systemService.isEnterprise) {
      this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
        this.isHaLicensed = isHaLicensed;
        this.checkForUpdateRunning();
        this.cdr.markForCheck();

        if (this.isHaLicensed) {
          this.form.removeControl('filelocation');
        }
      });
    }
  }

  checkForUpdateRunning(): void {
    this.ws.call('core.get_jobs', [[['method', '=', 'failover.upgrade'], ['state', '=', JobState.Running]]])
      .pipe(untilDestroyed(this)).subscribe({
        next: (jobs) => {
          if (jobs && jobs.length > 0) {
            this.showRunningUpdate(jobs[0].id);
          }
        },
        error: (err) => {
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
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.router.navigate(['/system-tasks/restart'], { skipLocationChange: true });
      });
  }

  onSubmit(): void {
    this.isFormLoading$.next(true);
    const value = this.form.value;
    value.filelocation = value.filelocation === ':temp:' ? null : value.filelocation;
    this.store$.dispatch(updateRebootAfterManualUpdate({
      rebootAfterManualUpdate: value.rebootAfterManualUpdate,
    }));
    this.systemService.updateRunningNoticeSent.emit();
    this.cdr.markForCheck();
    this.setupAndOpenUpdateJobDialog(value.updateFile, value.filelocation);
  }

  setupAndOpenUpdateJobDialog(files: FileList, fileLocation: string): void {
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
      .jobDialog(job$, { title: this.translate.instant(helptext.manual_update_action) })
      .afterClosed()
      .pipe(
        finalize(() => {
          this.isFormLoading$.next(false);
          this.cdr.markForCheck();
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => this.handleUpdateSuccess(),
        error: (job: Job) => this.handleUpdateFailure(job),
      });
  }

  finishNonHaUpdate(): void {
    if (this.form.value.rebootAfterManualUpdate) {
      this.router.navigate(['/system-tasks/restart'], { skipLocationChange: true });
    } else {
      this.dialogService.confirm({
        title: this.translate.instant('Restart'),
        message: this.translate.instant(helptext.rebootAfterManualUpdate.manual_reboot_msg),
      }).pipe(
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe(() => this.router.navigate(['/system-tasks/restart'], { skipLocationChange: true }));
    }
  }

  finishHaUpdate(): void {
    this.dialogService.closeAllDialogs();
    this.systemService.updateDone(); // Send 'finished' signal to topbar
    this.cdr.markForCheck();
    this.router.navigate(['/']);
    this.dialogService.confirm({
      title: helptext.ha_update.complete_title,
      message: helptext.ha_update.complete_msg,
      hideCheckbox: true,
      buttonText: helptext.ha_update.complete_action,
      hideCancel: true,
    }).pipe(untilDestroyed(this)).subscribe(() => {});
  }

  handleUpdateSuccess(): void {
    if (this.isHaLicensed) {
      this.finishHaUpdate();
    } else {
      this.finishNonHaUpdate();
    }
  }

  handleUpdateFailure = (failure: Job): void => {
    this.isFormLoading$.next(false);
    this.cdr.markForCheck();
    if (failure.error.includes(updateAgainCode)) {
      this.dialogService.confirm({
        title: helptext.continueDialogTitle,
        message: failure.error.replace(updateAgainCode, ''),
        buttonText: helptext.continueDialogAction,
      }).pipe(
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe(() => {
        this.resumeUpdateAfterFailure();
      });
      return;
    }
    this.dialogService.error(this.errorHandler.parseError(failure));
  };

  private resumeUpdateAfterFailure(): void {
    const job$: Observable<Job> = this.isHaLicensed
      ? this.ws.job('failover.upgrade', [{ resume: true, resume_manual: true }])
      : this.ws.job('update.file', [{ resume: true }]);

    this.dialogService
      .jobDialog(job$, { title: helptext.manual_update_action })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => this.handleUpdateSuccess(),
        error: (job: Job) => this.handleUpdateFailure(job),
      });
  }
}
