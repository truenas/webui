import { ApplicationRef, Component, Injector } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { FormUploadComponent } from 'app/pages/common/entity/entity-form/components/form-upload/form-upload.component';
import { T } from '../../../../translate-marker';
import { helptext_system_update as helptext } from 'app/helptext/system/update';
import * as _ from 'lodash';
import { WebSocketService, SystemGeneralService } from '../../../../services';
import { DialogService } from '../../../../services/dialog.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { MessageService } from '../../../common/entity/entity-form/services/message.service';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { CoreEvent } from 'app/core/services/core.service';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import { EntityUtils } from '../../../common/entity/utils';
import { take, filter } from 'rxjs/operators';

@Component({
  selector: 'app-manualupdate',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [MessageService],
})
export class ManualUpdateComponent extends ViewControllerComponent {
  formGroup: FormGroup;
  route_success: string[] = ['system', 'update'];
  protected dialogRef: any;
  fileLocation: any;
  subs: any;
  isHA = false;
  isUpdateRunning = false;
  updateMethod = 'update.update';
  saveSubmitText = T('Apply Update');
  protected fieldConfig: FieldConfig[] = [
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
      updater: (fileInput: FormUploadComponent) => this.updater(fileInput),
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

  save_button_enabled = false;

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
  ) {
    super();

    this.core.register({
      observerClass: this,
      eventName: 'SysInfo',
    }).subscribe((evt: CoreEvent) => {
      _.find(this.fieldConfig, { name: 'version' }).paraText += evt.data.version;
    });

    this.core.emit({ name: 'SysInfoRequest', sender: this });
  }

  preInit(entityForm: any) {
    if (window.localStorage.getItem('product_type') === 'ENTERPRISE') {
      this.ws.call('failover.licensed').subscribe((is_ha) => {
        if (is_ha) {
          this.isHA = true;
          this.updateMethod = 'failover.upgrade';
        } else {
          _.find(this.fieldConfig, { name: 'rebootAfterManualUpdate' })['isHidden'] = false;
        }
        this.checkForUpdateRunning();
      });
    }

    this.ws.call('pool.query').subscribe((pools) => {
      if (pools) {
        pools.forEach((pool) => {
          if (pool.is_decrypted) {
            _.find(this.fieldConfig, { name: 'filelocation' }).options.push({
              label: '/mnt/' + pool.name, value: '/mnt/' + pool.name,
            });
          }
        });
      }
    });
  }
  afterInit(entityForm: any) {
    this.ws.call('user.query', [[['id', '=', 1]]]).subscribe((ures) => {
      if (ures[0].attributes.preferences['rebootAfterManualUpdate'] === undefined) {
        ures[0].attributes.preferences['rebootAfterManualUpdate'] = false;
      }
      entityForm.formGroup.controls['rebootAfterManualUpdate'].setValue(ures[0].attributes.preferences['rebootAfterManualUpdate']);
      entityForm.formGroup.controls['rebootAfterManualUpdate'].valueChanges.subscribe((form_res) => {
        ures[0].attributes.preferences['rebootAfterManualUpdate'] = form_res;
        this.ws.call('user.set_attribute', [1, 'preferences', ures[0].attributes.preferences]).subscribe((res) => {
        });
      });
    });

    entityForm.formGroup.controls['filelocation'].valueChanges.subscribe((filelocation) => {
      if (filelocation === ':temp:') {
        _.find(this.fieldConfig, { name: 'filename' }).fileLocation = null;
      } else {
        _.find(this.fieldConfig, { name: 'filename' }).fileLocation = filelocation;
      }
    });
    this.messageService.messageSourceHasNewMessage$.subscribe((message) => {
      entityForm.formGroup.controls['filename'].setValue(message);
    });
    entityForm.submitFunction = this.customSubmit;
  }

  customSubmit(entityForm: any) {
    this.save_button_enabled = false;
    this.systemService.updateRunningNoticeSent.emit();
    this.ws.call('user.query', [[['id', '=', 1]]]).subscribe((ures) => {
      this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: helptext.manual_update_action }, disableClose: true });
      if (this.isHA) {
        this.dialogRef.componentInstance.disableProgressValue(true);
      }
      this.dialogRef.componentInstance.changeAltMessage(helptext.manual_update_description);
      this.dialogRef.componentInstance.wspost(this.subs.apiEndPoint, this.subs.formData);
      this.dialogRef.componentInstance.success.subscribe((succ) => {
        this.dialogRef.close(false);
        if (!this.isHA) {
          if (ures[0].attributes.preferences['rebootAfterManualUpdate']) {
            this.router.navigate(['/others/reboot']);
          } else {
            this.translate.get('Restart').subscribe((reboot: string) => {
              this.translate.get(helptext.rebootAfterManualUpdate.manual_reboot_msg).subscribe((reboot_prompt: string) => {
                this.dialogService.confirm(reboot, reboot_prompt).subscribe((reboot_res) => {
                  if (reboot_res) {
                    this.router.navigate(['/others/reboot']);
                  }
                });
              });
            });
          }
        } else { // HA System
          this.dialogService.closeAllDialogs();
          this.isUpdateRunning = false;
          this.systemService.updateDone(); // Send 'finished' signal to topbar
          this.router.navigate(['/']);
          this.dialogService.confirm(helptext.ha_update.complete_title,
            helptext.ha_update.complete_msg, true,
            helptext.ha_update.complete_action, false, '', '', '', '', true).subscribe(() => {
          });
        }
      });
      this.dialogRef.componentInstance.prefailure.subscribe((prefailure) => {
        this.dialogRef.close(false);
        this.dialogService.errorReport(helptext.manual_update_error_dialog.message,
          `${prefailure.status.toString()} ${prefailure.statusText}`);
        this.save_button_enabled = true;
      });
      this.dialogRef.componentInstance.failure
        .pipe(take(1))
        .subscribe((failure) => {
          this.dialogRef.close(false);
          this.dialogService.errorReport(failure.error, failure.state, failure.exception);
          this.save_button_enabled = true;
        });
    });
  }

  updater(fileInput: FormUploadComponent) {
    const fileBrowser = fileInput.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      const updateFile: File = fileBrowser.files[0];
      const isScaleUpdate = updateFile.name.toLocaleLowerCase().includes('scale');

      if (!isScaleUpdate) {
        this.addUpdateFile(updateFile, fileInput.apiEndPoint);
        return;
      }

      let scaleMessage = helptext.scaleUpdate.warning;
      if (this.isHA) {
        scaleMessage += ' ' + helptext.scaleUpdate.haWarning;
      }

      this.dialogService.confirm({
        title: helptext.scaleUpdate.title,
        message: scaleMessage,
      })
        .subscribe((confirmed) => {
          if (confirmed) {
            this.addUpdateFile(updateFile, fileInput.apiEndPoint);
          } else {
            fileBrowser.value = '';
          }
        });
    } else {
      this.save_button_enabled = false;
    }
  }

  showRunningUpdate(jobId) {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: 'Update' }, disableClose: true });
    if (this.isHA) {
      this.dialogRef.componentInstance.disableProgressValue(true);
    }
    this.dialogRef.componentInstance.jobId = jobId;
    this.dialogRef.componentInstance.wsshow();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.router.navigate(['/others/reboot']);
    });
    this.dialogRef.componentInstance.failure.subscribe((err) => {
      new EntityUtils().handleWSError(this, err, this.dialogService);
    });
  }

  checkForUpdateRunning() {
    this.ws.call('core.get_jobs', [[['method', '=', this.updateMethod], ['state', '=', 'RUNNING']]]).subscribe(
      (res) => {
        if (res && res.length > 0) {
          this.isUpdateRunning = true;
          this.showRunningUpdate(res[0].id);
        }
      },
      (err) => {
        console.error(err);
      },
    );
  }

  private addUpdateFile(file: File, apiEndPoint: string) {
    this.save_button_enabled = true;
    const formData: FormData = new FormData();
    if (this.isHA) {
      formData.append('data', JSON.stringify({
        method: 'failover.upgrade',
      }));
    } else {
      formData.append('data', JSON.stringify({
        method: 'update.file',
        params: [{ destination: this.fileLocation }],
      }));
    }
    formData.append('file', file);
    this.subs = { apiEndPoint, formData };
  }
}
