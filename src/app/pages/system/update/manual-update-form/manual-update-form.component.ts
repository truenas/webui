import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, noop, Observable, of,
} from 'rxjs';
import {
  filter, take, tap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { helptextSystemUpdate as helptext } from 'app/helptext/system/update';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { updateAgainCode } from 'app/pages/system/update/update-again-code.constant';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { UpdateService } from 'app/services/update.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { updateRebootAfterManualUpdate } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  templateUrl: './manual-update-form.component.html',
  styleUrls: ['manual-update-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualUpdateFormComponent implements OnInit {
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
    private mdDialog: MatDialog,
    protected router: Router,
    public systemService: SystemGeneralService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private authService: AuthService,
    private translate: TranslateService,
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private updateService: UpdateService,
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

  showRunningUpdate(jobId: number): void {
    const dialogRef = this.mdDialog.open(EntityJobComponent, { data: { title: this.translate.instant('Update') } });
    if (this.isHaLicensed) {
      dialogRef.componentInstance.disableProgressValue(true);
    }
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.router.navigate(['/others/reboot'], { skipLocationChange: true });
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      this.dialogService.error(this.errorHandler.parseJobError(err));
    });
    this.cdr.markForCheck();
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
    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: { title: helptext.manual_update_action },
      disableClose: true,
    });
    if (this.isHaLicensed) {
      dialogRef.componentInstance.disableProgressValue(true);
    }

    dialogRef.componentInstance.changeAltMessage(helptext.manual_update_description);

    const formData: FormData = this.generateFormData(files, fileLocation);

    dialogRef.componentInstance.wspostWithProgressUpdates(this.apiEndPoint, formData);
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close(false);
      this.handleUpdateSuccess();
    });

    dialogRef.componentInstance.prefailure.pipe(
      tap(() => dialogRef.close(false)),
      untilDestroyed(this),
    ).subscribe((error) => this.handleUpdatePreFailure(error));

    dialogRef.componentInstance.failure.pipe(
      take(1),
      tap(() => dialogRef.close(false)),
      untilDestroyed(this),
    ).subscribe((error) => this.handleUpdateFailure(error));

    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading$.next(false);
      this.cdr.markForCheck();
    });
    this.cdr.markForCheck();
  }

  generateFormData(files: FileList, fileLocation: string): FormData {
    const formData = new FormData();
    if (this.isHaLicensed) {
      formData.append('data', JSON.stringify({
        method: 'failover.upgrade',
      }));
    } else {
      formData.append('data', JSON.stringify({
        method: 'update.file',
        params: [{ destination: fileLocation }],
      }));
    }
    formData.append('file', files[0]);
    return formData;
  }

  finishNonHaUpdate(): void {
    if (this.form.value.rebootAfterManualUpdate) {
      this.router.navigate(['/others/reboot'], { skipLocationChange: true });
    } else {
      this.dialogService.confirm({
        title: this.translate.instant('Restart'),
        message: this.translate.instant(helptext.rebootAfterManualUpdate.manual_reboot_msg),
      }).pipe(
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe(() => this.router.navigate(['/others/reboot'], { skipLocationChange: true }));
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
    this.updateService.setForHardRefresh();
    if (this.isHaLicensed) {
      this.finishHaUpdate();
    } else {
      this.finishNonHaUpdate();
    }
  }

  handleUpdatePreFailure(prefailure: HttpErrorResponse): void {
    this.isFormLoading$.next(false);
    this.dialogService.error({
      title: helptext.manual_update_error_dialog.message,
      message: `${prefailure.status.toString()} ${prefailure.statusText}`,
    });
    this.cdr.markForCheck();
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
    this.dialogService.error(this.errorHandler.parseJobError(failure));
  };

  private resumeUpdateAfterFailure(): void {
    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: { title: helptext.manual_update_action },
      disableClose: true,
    });
    if (this.isHaLicensed) {
      dialogRef.componentInstance.setCall('failover.upgrade', [{ resume: true, resume_manual: true }]);
      dialogRef.componentInstance.disableProgressValue(true);
    } else {
      dialogRef.componentInstance.setCall('update.file', [{ resume: true }]);
    }

    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close(false);
      this.handleUpdateSuccess();
    });

    dialogRef.componentInstance.prefailure.pipe(
      tap(() => dialogRef.close(false)),
      untilDestroyed(this),
    ).subscribe((error) => this.handleUpdatePreFailure(error));

    dialogRef.componentInstance.failure.pipe(
      take(1),
      tap(() => dialogRef.close(false)),
      untilDestroyed(this),
    ).subscribe((error) => this.handleUpdateFailure(error));

    dialogRef.componentInstance.submit();
  }
}
