import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, noop, Observable, of, Subject,
} from 'rxjs';
import {
  filter,
  map, take, tap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { helptextSystemUpdate as helptext } from 'app/helptext/system/update';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import { Option } from 'app/interfaces/option.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { MessageService } from 'app/modules/entity/entity-form/services/message.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';

@UntilDestroy()
@Component({
  selector: 'manual-update-form',
  templateUrl: './manual-update-form.component.html',
  providers: [MessageService],
  styleUrls: ['manual-update-form.component.scss'],
})
export class ManualUpdateFormComponent implements OnInit {
  isFormLoading$: Subject<boolean> = new BehaviorSubject(false);
  form = this.formBuilder.group({
    filelocation: ['', Validators.required],
    updateFile: [null as FileList],
    rebootAfterManualUpdate: [false],
  });
  updateFile = '';
  private get apiEndPoint(): string {
    return '/_upload?auth_token=' + this.ws.token;
  }

  userPrefs: Preferences = null;
  readonly helptext = helptext;
  currentVersion = '';
  fileLocationOptions$: Observable<Option[]>;

  isHa = false;

  constructor(
    private dialogService: DialogService,
    private mdDialog: MatDialog,
    protected router: Router,
    private systemService: SystemGeneralService,
    private formBuilder: FormBuilder,
    private core: CoreService,
    private ws: WebSocketService,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.checkHaLicenseAndUpdateStatus();
    this.getVersionNoFromSysInfo();
    this.setPoolOptions();
    this.getUserPrefs();
    this.mapTempFileLocationValueToNull();
  }

  mapTempFileLocationValueToNull(): void {
    this.form.get('filelocation').valueChanges.pipe(
      map((filelocation) => (filelocation === ':temp:' ? null : filelocation)),
      untilDestroyed(this),
    ).subscribe(noop);
  }

  getUserPrefs(): Observable<Preferences> {
    if (this.userPrefs) {
      return of(this.userPrefs);
    }

    return this.ws.call('user.query', [[['id', '=', 1]]]).pipe(
      map((users) => users[0].attributes.preferences),
      tap((prefs) => this.userPrefs = prefs),
      tap((userPrefs) => {
        if (userPrefs.rebootAfterManualUpdate === undefined) {
          userPrefs.rebootAfterManualUpdate = false;
        }
        this.form.get('rebootAfterManualUpdate').setValue(this.userPrefs.rebootAfterManualUpdate);
      }),
    );
  }

  getVersionNoFromSysInfo(): void {
    this.core.register({
      observerClass: this,
      eventName: 'SysInfo',
    }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
      this.currentVersion = evt.data.version;
    });
    this.core.emit({ name: 'SysInfoRequest', sender: this });
  }

  setPoolOptions(): void {
    this.ws.call('pool.query').pipe(untilDestroyed(this)).subscribe((pools) => {
      if (!pools) {
        return;
      }
      const options = [{ label: 'Memory device', value: ':temp:' }];
      pools.forEach((pool) => {
        options.push({
          label: '/mnt/' + pool.name, value: '/mnt/' + pool.name,
        });
      });
      this.fileLocationOptions$ = of(options);
    });
  }

  get isEnterprise(): boolean {
    return window.localStorage.getItem('product_type').includes(ProductType.Enterprise);
  }

  checkHaLicenseAndUpdateStatus(): void {
    if (this.isEnterprise) {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((isHa) => {
        this.isHa = isHa;
        this.checkForUpdateRunning();
      });
    }
  }

  checkForUpdateRunning(): void {
    this.ws.call('core.get_jobs', [[['method', '=', 'failover.upgrade'], ['state', '=', JobState.Running]]])
      .pipe(untilDestroyed(this)).subscribe(
        (jobs) => {
          if (jobs && jobs.length > 0) {
            this.showRunningUpdate(jobs[0].id);
          }
        },
        (err) => {
          console.error(err);
        },
      );
  }

  showRunningUpdate(jobId: number): void {
    const dialogRef = this.mdDialog.open(EntityJobComponent, { data: { title: this.translate.instant('Update') } });
    if (this.isHa) {
      dialogRef.componentInstance.disableProgressValue(true);
    }
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.router.navigate(['/others/reboot']);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      new EntityUtils().handleWsError(this, err, this.dialogService);
    });
  }

  onSubmit(): void {
    this.isFormLoading$.next(true);
    const value = this.form.value;
    this.userPrefs = {
      ...this.userPrefs,
      rebootAfterManualUpdate: value.rebootAfterManualUpdate,
    };
    this.ws.call('user.set_attribute', [1, 'preferences', this.userPrefs]).pipe(untilDestroyed(this)).subscribe(noop);
    this.systemService.updateRunningNoticeSent.emit();
    this.setupUpdateJobDialog(value.updateFile, value.filelocation);
  }

  setupUpdateJobDialog(files: FileList, fileLocation: string): void {
    if (!files.length) {
      return;
    }
    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: { title: helptext.manual_update_action },
    });
    if (this.isHa) {
      dialogRef.componentInstance.disableProgressValue(true);
    }
    dialogRef.componentInstance.changeAltMessage(helptext.manual_update_description);
    const formData: FormData = new FormData();
    if (this.isHa) {
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

    dialogRef.componentInstance.wspostWithProgressUpdates(this.apiEndPoint, formData);
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close(false);
      if (!this.isHa) {
        if (this.userPrefs.rebootAfterManualUpdate) {
          this.router.navigate(['/others/reboot']);
        } else {
          this.dialogService.confirm({
            title: this.translate.instant('Restart'),
            message: this.translate.instant(helptext.rebootAfterManualUpdate.manual_reboot_msg),
          }).pipe(
            filter(Boolean),
            untilDestroyed(this),
          ).subscribe(() => this.router.navigate(['/others/reboot']));
        }
      } else { // HA System
        this.dialogService.closeAllDialogs();
        this.systemService.updateDone(); // Send 'finished' signal to topbar
        this.router.navigate(['/']);
        this.dialogService.confirm({
          title: helptext.ha_update.complete_title,
          message: helptext.ha_update.complete_msg,
          hideCheckBox: true,
          buttonMsg: helptext.ha_update.complete_action,
          hideCancel: true,
        }).pipe(untilDestroyed(this)).subscribe(() => {});
      }
    });
    dialogRef.componentInstance.prefailure
      .pipe(untilDestroyed(this))
      .subscribe((prefailure: HttpErrorResponse) => {
        dialogRef.close(false);
        this.isFormLoading$.next(false);
        this.dialogService.errorReport(
          helptext.manual_update_error_dialog.message,
          `${prefailure.status.toString()} ${prefailure.statusText}`,
        );
      });
    dialogRef.componentInstance.failure
      .pipe(take(1), untilDestroyed(this)).subscribe((failure) => {
        dialogRef.close(false);
        this.isFormLoading$.next(false);
        this.dialogService.errorReport(failure.error, failure.state, failure.exception);
      });
    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading$.next(false);
    });
  }
}
