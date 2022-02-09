import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { ApplicationRef, Component, Injector } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import { JobState } from 'app/enums/job-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { helptextSystemUpdate as helptext } from 'app/helptext/system/update';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import { FormUploadComponent } from 'app/pages/common/entity/entity-form/components/form-upload/form-upload.component';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig, FormParagraphConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, SystemGeneralService, AppLoaderService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'app-manualupdate',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [MessageService],
})
export class ManualUpdateComponent extends ViewControllerComponent implements FormConfiguration {
  formGroup: FormGroup;
  routeSuccess: string[] = ['system', 'update'];
  protected dialogRef: MatDialogRef<EntityJobComponent>;
  fileLocation: string;
  subs: { formData: FormData; apiEndPoint: string };
  isHa = false;
  isUpdateRunning = false;
  updateMethod = 'update.update';
  saveSubmitText = this.translate.instant('Apply Update');
  fieldConfig: FieldConfig[] = [
    {
      type: 'paragraph',
      name: 'version',
      paraText: helptext.version.paraText,
    },
    {
      type: 'select',
      name: 'filelocation',
      placeholder: helptext.filelocation.placeholder,
      tooltip: helptext.filelocation.tooltip,
      options: [{ label: 'Memory device', value: ':temp:' }],
      required: true,
      validation: helptext.filelocation.validation,
    },
    {
      type: 'upload',
      name: 'filename',
      placeholder: helptext.filename.placeholder,
      tooltip: helptext.filename.tooltip,
      fileLocation: '',
      message: this.messageService,
      acceptedFiles: '.tar,.update',
      updater: (file: FormUploadComponent) => this.updater(file),
      parent: this,
      hideButton: true,
    },
    {
      type: 'checkbox',
      name: 'rebootAfterManualUpdate',
      placeholder: helptext.rebootAfterManualUpdate.placeholder,
      tooltip: helptext.rebootAfterManualUpdate.tooltip,
      value: false,
      isHidden: true,
    },
  ];

  saveButtonEnabled = false;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    public messageService: MessageService,
    protected dialog: MatDialog,
    public translate: TranslateService,
    private dialogService: DialogService,
    private systemService: SystemGeneralService,
    private loader: AppLoaderService,
  ) {
    super();

    this.core.register({
      observerClass: this,
      eventName: 'SysInfo',
    }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
      const config: FormParagraphConfig = _.find(this.fieldConfig, { name: 'version' });
      config.paraText += evt.data.version;
    });

    this.core.emit({ name: 'SysInfoRequest', sender: this });
  }

  preInit(): void {
    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)) {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((isHa) => {
        if (isHa) {
          this.isHa = true;
          this.updateMethod = 'failover.upgrade';
        } else {
          _.find(this.fieldConfig, { name: 'rebootAfterManualUpdate' })['isHidden'] = false;
        }
        this.checkForUpdateRunning();
      });
    }

    this.ws.call('pool.query').pipe(untilDestroyed(this)).subscribe((pools) => {
      if (!pools) {
        return;
      }

      pools.forEach((pool) => {
        const config = _.find(this.fieldConfig, { name: 'filelocation' }) as FormSelectConfig;
        config.options.push({
          label: '/mnt/' + pool.name, value: '/mnt/' + pool.name,
        });
      });
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.ws.call('user.query', [[['id', '=', 1]]]).pipe(untilDestroyed(this)).subscribe((ures) => {
      if (ures[0].attributes.preferences['rebootAfterManualUpdate'] === undefined) {
        ures[0].attributes.preferences['rebootAfterManualUpdate'] = false;
      }
      entityForm.formGroup.controls['rebootAfterManualUpdate'].setValue(ures[0].attributes.preferences['rebootAfterManualUpdate']);
      entityForm.formGroup.controls['rebootAfterManualUpdate'].valueChanges.pipe(untilDestroyed(this)).subscribe((rebootAfterManualUpdate: boolean) => {
        ures[0].attributes.preferences['rebootAfterManualUpdate'] = rebootAfterManualUpdate;
        this.ws.call('user.set_attribute', [1, 'preferences', ures[0].attributes.preferences]).pipe(untilDestroyed(this)).subscribe(() => {
        });
      });
    });

    entityForm.formGroup.controls['filelocation'].valueChanges.pipe(untilDestroyed(this)).subscribe((filelocation: string) => {
      if (filelocation === ':temp:') {
        const config = _.find(this.fieldConfig, { name: 'filename' }) as FormSelectConfig;
        config.fileLocation = null;
      } else {
        const config = _.find(this.fieldConfig, { name: 'filename' }) as FormSelectConfig;
        config.fileLocation = filelocation;
      }
    });
    this.messageService.messageSourceHasNewMessage$.pipe(untilDestroyed(this)).subscribe((message) => {
      entityForm.formGroup.controls['filename'].setValue(message);
    });
    // TODO: customSubmit need to return an Observable
    entityForm.submitFunction = this.customSubmit as any;
  }

  customSubmit(): void {
    this.saveButtonEnabled = false;
    this.systemService.updateRunningNoticeSent.emit();
    this.ws.call('user.query', [[['id', '=', 1]]]).pipe(untilDestroyed(this)).subscribe((ures) => {
      this.dialogRef = this.dialog.open(EntityJobComponent, {
        data: { title: helptext.manual_update_action },
      });
      if (this.isHa) {
        this.dialogRef.componentInstance.disableProgressValue(true);
      }
      this.dialogRef.componentInstance.changeAltMessage(helptext.manual_update_description);
      this.loader.open('Uploading', true);
      this.dialogRef.componentInstance.wspostWithProgressReports(this.subs.apiEndPoint, this.subs.formData)
        .pipe(untilDestroyed(this)).subscribe(
          (uploadProgress: { progress: number; status: HttpEventType }) => {
            if (uploadProgress.status === HttpEventType.UploadProgress && uploadProgress.progress !== null) {
              this.loader.dialogRef.componentInstance.progressUpdater.next(uploadProgress.progress);
            } else if (uploadProgress.status === HttpEventType.Response) {
              this.loader.close();
            }
          },
          () => {
            this.loader.close();
          },
        );
      // this.dialogRef.componentInstance.wspost(this.subs.apiEndPoint, this.subs.formData);
      this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        this.dialogRef.close(false);
        if (!this.isHa) {
          if (ures[0].attributes.preferences['rebootAfterManualUpdate']) {
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
          this.isUpdateRunning = false;
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
      this.dialogRef.componentInstance.prefailure
        .pipe(untilDestroyed(this))
        .subscribe((prefailure: HttpErrorResponse) => {
          this.dialogRef.close(false);
          this.dialogService.errorReport(
            helptext.manual_update_error_dialog.message,
            `${prefailure.status.toString()} ${prefailure.statusText}`,
          );
          this.saveButtonEnabled = true;
        });
      this.dialogRef.componentInstance.failure
        .pipe(take(1))
        .pipe(untilDestroyed(this)).subscribe((failure) => {
          this.dialogRef.close(false);
          this.dialogService.errorReport(failure.error, failure.state, failure.exception);
          this.saveButtonEnabled = true;
        });
    });
  }

  updater(file: FormUploadComponent): void {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      this.saveButtonEnabled = true;
      const formData: FormData = new FormData();
      if (this.isHa) {
        formData.append('data', JSON.stringify({
          method: 'failover.upgrade',
        }));
      } else {
        formData.append('data', JSON.stringify({
          method: 'update.file',
          params: [{ destination: this.fileLocation }],
        }));
      }
      formData.append('file', fileBrowser.files[0]);
      this.subs = { apiEndPoint: file.apiEndPoint, formData };
    } else {
      this.saveButtonEnabled = false;
    }
  }

  showRunningUpdate(jobId: number): void {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('Update') } });
    if (this.isHa) {
      this.dialogRef.componentInstance.disableProgressValue(true);
    }
    this.dialogRef.componentInstance.jobId = jobId;
    this.dialogRef.componentInstance.wsshow();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.router.navigate(['/others/reboot']);
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      new EntityUtils().handleWsError(this, err, this.dialogService);
    });
  }

  checkForUpdateRunning(): void {
    this.ws.call('core.get_jobs', [[['method', '=', this.updateMethod], ['state', '=', JobState.Running]]]).pipe(untilDestroyed(this)).subscribe(
      (jobs) => {
        if (jobs && jobs.length > 0) {
          this.isUpdateRunning = true;
          this.showRunningUpdate(jobs[0].id);
        }
      },
      (err) => {
        console.error(err);
      },
    );
  }
}
