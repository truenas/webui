import { ApplicationRef, Component, Injector } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CoreEvent } from 'app/interfaces/events';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { ProductType } from '../../../../enums/product-type.enum';
import { T } from '../../../../translate-marker';
import { helptext_system_update as helptext } from 'app/helptext/system/update';
import * as _ from 'lodash';
import { WebSocketService, SystemGeneralService } from '../../../../services';
import { DialogService } from '../../../../services/dialog.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { MessageService } from '../../../common/entity/entity-form/services/message.service';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import { EntityUtils } from '../../../common/entity/utils';
import { take } from 'rxjs/operators';
import { EntityJobState } from 'app/enums/entity-job-state.enum';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';

@Component({
  selector: 'app-manualupdate',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [MessageService],
})
export class ManualUpdateComponent extends ViewControllerComponent implements FormConfiguration {
  formGroup: FormGroup;
  route_success: string[] = ['system', 'update'];
  protected dialogRef: any;
  fileLocation: any;
  subs: any;
  isHA = false;
  isUpdateRunning = false;
  updateMethod = 'update.update';
  saveSubmitText = T('Apply Update');
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
      updater: this.updater,
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

  preInit(): void {
    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)) {
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
      if (!pools) {
        return;
      }

      pools.forEach((pool) => {
        if (!pool.is_decrypted) {
          return;
        }

        _.find(this.fieldConfig, { name: 'filelocation' }).options.push({
          label: '/mnt/' + pool.name, value: '/mnt/' + pool.name,
        });
      });
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.ws.call('user.query', [[['id', '=', 1]]]).subscribe((ures) => {
      if (ures[0].attributes.preferences['rebootAfterManualUpdate'] === undefined) {
        ures[0].attributes.preferences['rebootAfterManualUpdate'] = false;
      }
      entityForm.formGroup.controls['rebootAfterManualUpdate'].setValue(ures[0].attributes.preferences['rebootAfterManualUpdate']);
      entityForm.formGroup.controls['rebootAfterManualUpdate'].valueChanges.subscribe((form_res: any) => {
        ures[0].attributes.preferences['rebootAfterManualUpdate'] = form_res;
        this.ws.call('user.set_attribute', [1, 'preferences', ures[0].attributes.preferences]).subscribe(() => {
        });
      });
    });

    entityForm.formGroup.controls['filelocation'].valueChanges.subscribe((filelocation: string) => {
      if (filelocation === ':temp:') {
        _.find(this.fieldConfig, { name: 'filename' }).fileLocation = null;
      } else {
        _.find(this.fieldConfig, { name: 'filename' }).fileLocation = filelocation;
      }
    });
    this.messageService.messageSourceHasNewMessage$.subscribe((message) => {
      entityForm.formGroup.controls['filename'].setValue(message);
    });
    // TODO: customSubmit need to return an Observable
    entityForm.submitFunction = this.customSubmit as any;
  }

  customSubmit(): void {
    this.save_button_enabled = false;
    this.systemService.updateRunningNoticeSent.emit();
    this.ws.call('user.query', [[['id', '=', 1]]]).subscribe((ures) => {
      this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: helptext.manual_update_action }, disableClose: true });
      if (this.isHA) {
        this.dialogRef.componentInstance.disableProgressValue(true);
      }
      this.dialogRef.componentInstance.changeAltMessage(helptext.manual_update_description);
      this.dialogRef.componentInstance.wspost(this.subs.apiEndPoint, this.subs.formData);
      this.dialogRef.componentInstance.success.subscribe(() => {
        this.dialogRef.close(false);
        if (!this.isHA) {
          if (ures[0].attributes.preferences['rebootAfterManualUpdate']) {
            this.router.navigate(['/others/reboot']);
          } else {
            this.translate.get('Restart').subscribe((reboot: string) => {
              this.translate.get(helptext.rebootAfterManualUpdate.manual_reboot_msg).subscribe((reboot_prompt: string) => {
                this.dialogService.confirm(reboot, reboot_prompt).subscribe((reboot_res: boolean) => {
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
      this.dialogRef.componentInstance.prefailure.subscribe((prefailure: any) => {
        this.dialogRef.close(false);
        this.dialogService.errorReport(helptext.manual_update_error_dialog.message,
          `${prefailure.status.toString()} ${prefailure.statusText}`);
        this.save_button_enabled = true;
      });
      this.dialogRef.componentInstance.failure
        .pipe(take(1))
        .subscribe((failure: any) => {
          this.dialogRef.close(false);
          this.dialogService.errorReport(failure.error, failure.state, failure.exception);
          this.save_button_enabled = true;
        });
    });
  }

  updater(file: any, parent: any): void {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      parent.save_button_enabled = true;
      const formData: FormData = new FormData();
      if (parent.isHA) {
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
      parent.subs = { apiEndPoint: file.apiEndPoint, formData };
    } else {
      parent.save_button_enabled = false;
    }
  }

  showRunningUpdate(jobId: number): void {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: 'Update' }, disableClose: true });
    if (this.isHA) {
      this.dialogRef.componentInstance.disableProgressValue(true);
    }
    this.dialogRef.componentInstance.jobId = jobId;
    this.dialogRef.componentInstance.wsshow();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.router.navigate(['/others/reboot']);
    });
    this.dialogRef.componentInstance.failure.subscribe((err: any) => {
      new EntityUtils().handleWSError(this, err, this.dialogService);
    });
  }

  checkForUpdateRunning(): void {
    this.ws.call('core.get_jobs', [[['method', '=', this.updateMethod], ['state', '=', EntityJobState.Running]]]).subscribe(
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
}
