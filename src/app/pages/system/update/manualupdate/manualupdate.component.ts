import { ApplicationRef, Component, Injector } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { helptext_system_update as helptext } from 'app/helptext/system/update';
import * as _ from 'lodash';
import { RestService, WebSocketService, SystemGeneralService } from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../../services/dialog.service';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { MessageService } from '../../../common/entity/entity-form/services/message.service';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';

@Component({
  selector: 'app-manualupdate',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers : [ MessageService, SystemGeneralService ]
})
export class ManualUpdateComponent {
  public formGroup: FormGroup;
  public route_success: string[] = ['system','update'];
  protected dialogRef: any;
  public fileLocation: any;
  public subs: any;
  // public custActions: Array<any> = [
  //   {
  //     id : 'save_config',
  //     name : T('Save Config'),
  //     function : () => {
  //       this.dialogservice.dialogForm(this.saveConfigFormConf);
  //     }
  //   }
  // ];
  public saveSubmitText ="Apply Update";
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
      options:[{ label : 'Memory device', value : ':temp:'}],
      required: true,
      validation : helptext.filelocation.validation
    },
    {
      type: 'upload',
      name: 'filename',
      placeholder: helptext.filename.placeholder,
      tooltip: helptext.filename.tooltip,
      // validation : [ Validators.required],
      fileLocation: '',
      message: this.messageService,
      acceptedFiles: '.tar',
      updater: this.updater,
      parent: this,
      // required: true,
      hideButton: true,
    },
    {
      type: 'checkbox',
      name: 'rebootAfterManualUpdate',
      placeholder: helptext.rebootAfterManualUpdate.placeholder,
      tooltip: helptext.rebootAfterManualUpdate.tooltip,
      value: false
    }
  ];
  protected saveConfigFieldConf: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'secretseed',
      placeholder: helptext.secretseed.placeholder
    }
  ];
  public saveConfigFormConf: DialogFormConfiguration = {
    title: "Save Config",
    fieldConfig: this.saveConfigFieldConf,
    method_ws: 'core.download',
    saveButtonText: helptext.save_config_form.button_text,
    customSubmit: this.saveCofigSubmit,
  }
  public save_button_enabled = false;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    public messageService: MessageService,
    protected dialog: MatDialog,
    protected dialogservice: DialogService,
    public snackBar: MatSnackBar,
    public translate: TranslateService,
    private dialogService: DialogService,
    private loader: AppLoaderService,
    private systemService: SystemGeneralService,
  ) {
    this.systemService.getSysInfo().subscribe(
      (res) => {
        _.find(this.fieldConfig, {name: 'version'}).paraText += res.version;
      })
  }

  preInit(entityForm: any) {
    this.ws.call('pool.query').subscribe((pools)=>{
      if(pools){
        pools.forEach(pool => {
          if (pool.is_decrypted){
            _.find(this.fieldConfig, {'name' : 'filelocation'}).options.push({
              label : '/mnt/'+pool.name, value : '/mnt/'+pool.name
            })

          }
        });
      }
    })
  }
  afterInit(entityForm: any) {
    this.ws.call('user.query',[[["id", "=",1]]]).subscribe((ures)=>{
      if(ures[0].attributes.preferences['rebootAfterManualUpdate'] === undefined){
        ures[0].attributes.preferences['rebootAfterManualUpdate'] = false
      }
      entityForm.formGroup.controls['rebootAfterManualUpdate'].setValue(ures[0].attributes.preferences['rebootAfterManualUpdate']);
      entityForm.formGroup.controls['rebootAfterManualUpdate'].valueChanges.subscribe((form_res)=>{
        ures[0].attributes.preferences['rebootAfterManualUpdate'] = form_res;
        this.ws.call('user.set_attribute', [1, 'preferences', ures[0].attributes.preferences]).subscribe((res)=>{
        })
  
      })
    })

    entityForm.formGroup.controls['filelocation'].valueChanges.subscribe((filelocation)=>{
      if(filelocation === ":temp:"){
        _.find(this.fieldConfig,{name:'filename'}).fileLocation = null;
      } else {
        _.find(this.fieldConfig,{name:'filename'}).fileLocation = filelocation;
      };
    });
    this.messageService.messageSourceHasNewMessage$.subscribe((message)=>{
      entityForm.formGroup.controls['filename'].setValue(message);
    });
    entityForm.submitFunction = this.customSubmit;
  }
  customSubmit(entityForm: any) {
    this.systemService.updateRunningNoticeSent.emit();
    this.ws.call('user.query',[[["id", "=",1]]]).subscribe((ures)=>{
      this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Manual Update" }, disableClose: true });
      this.dialogRef.componentInstance.wspost(this.subs.apiEndPoint, this.subs.formData);
      this.dialogRef.componentInstance.success.subscribe((succ)=>{
        this.dialogRef.close(false);
        if (ures[0].attributes.preferences['rebootAfterManualUpdate']) {
          this.router.navigate(['/others/reboot']);
        } else {
          this.translate.get('Restart').subscribe((reboot: string) => {
            this.translate.get('Update successful. Please reboot for the update to take effect. Reboot now?').subscribe((reboot_prompt: string) => {
              this.dialogService.confirm(reboot, reboot_prompt).subscribe((reboot_res) => {
                if (reboot_res) {
                  this.router.navigate(['/others/reboot']);
                }
              });
            });
          });
        };
      })
      this.dialogRef.componentInstance.prefailure.subscribe((prefailure)=>{
        this.dialogRef.close(false);
        this.dialogService.errorReport(helptext.manual_update_error_dialog.message, 
          `${prefailure.status.toString()} ${prefailure.statusText}`)
      })
      this.dialogRef.componentInstance.failure.subscribe((failure)=>{
        this.dialogRef.close(false);
        this.dialogService.errorReport(failure.error,failure.state,failure.exception)
      })

    })


  }

updater(file: any, parent: any){
  const fileBrowser = file.fileInput.nativeElement;
  if (fileBrowser.files && fileBrowser.files[0]) {
    parent.save_button_enabled = true;
    const formData: FormData = new FormData();
    formData.append('data', JSON.stringify({
      "method": "update.file",
      "params": [{"destination":this.fileLocation}]
    }));
    formData.append('file', fileBrowser.files[0]);
    parent.subs = {"apiEndPoint":file.apiEndPoint, "formData": formData}
  } else {
    parent.save_button_enabled = false;
  }
}

saveCofigSubmit(entityDialog) {
  entityDialog.ws.call('system.info', []).subscribe((res) => {
    let fileName = "";
    if (res) {
      const hostname = res.hostname.split('.')[0];
      const date = entityDialog.datePipe.transform(new Date(),"yyyyMMddHHmmss");
      fileName = hostname + '-' + res.version + '-' + date;
      if (entityDialog.formValue['secretseed']) {
        fileName += '.tar';
      } else {
        fileName += '.db';
      }
    }

    entityDialog.ws.call('core.download', ['config.save', [{ 'secretseed': entityDialog.formValue['secretseed'] }], fileName])
      .subscribe(
        (succ) => {
          entityDialog.snackBar.open("Opening download window. Make sure pop-ups are enabled in the browser.", "Success" , {
            duration: 5000
          });
          window.open(succ[1]);
          entityDialog.dialogRef.close();
        },
        (err) => {
          entityDialog.snackBar.open("Check the network connection", "Failed" , {
            duration: 5000
          });
        }
      );
  });
}

}
