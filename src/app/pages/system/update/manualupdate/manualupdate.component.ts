import {
  ApplicationRef,
  Component,
  Injector,
} from '@angular/core';
import {
  FormGroup,
  Validators
} from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import {MessageService} from '../../../common/entity/entity-form/services/message.service';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { DialogService } from '../../../../services/dialog.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';


@Component({
  selector: 'app-manualupdate',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers : [ MessageService ]
})
export class ManualUpdateComponent {
  public formGroup: FormGroup;
  public route_success: string[] = ['system','update'];
  protected dialogRef: any;
  public fileLocation: any;
  public subs: any;
  public custActions: Array<any> = [
    {
      id : 'save_config',
      name : T('Save Config'),
      function : () => {
        this.dialogservice.dialogForm(this.saveConfigFormConf);
      }
    }
  ];
  public saveSubmitText ="Apply Update";
  protected fieldConfig: FieldConfig[] = [
    {
      type: 'select',
      name: 'filelocation',
      placeholder: T('Location to temporarily store update file'),
      tooltip: T('The update file is temporarily stored here before being applied.'),
      options:[{ label : 'Memory device', value : ':temp:'}],
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'upload',
      name: 'filename',
      placeholder: T('Update file to be installed'),
      tooltip: T(''),
      validation : [ Validators.required],
      fileLocation: '',
      message: this.messageService,
      acceptedFiles: '.tar',
      updater: this.updater,
      parent: this,
      required: true
    },
  ];
  protected saveConfigFieldConf: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'secretseed',
      placeholder: T('Export Password Secret Seed')
    }
  ];
  public saveConfigFormConf: DialogFormConfiguration = {
    title: "Save Config",
    fieldConfig: this.saveConfigFieldConf,
    method_ws: 'core.download',
    saveButtonText: T('Save'),
    customSubmit: this.saveCofigSubmit,
  }

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
  ) {}

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
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Manual Update" }, disableClose: true });
    this.dialogRef.componentInstance.wspost(this.subs.apiEndPoint, this.subs.formData);
    this.dialogRef.componentInstance.success.subscribe((succ)=>{
      this.dialogRef.close(false);
      this.translate.get('Restart').subscribe((reboot: string) => {
        this.translate.get('The update has been successfully applied, it is recommended that you reboot the machine now for the update to take effect. Do you wish to reboot?').subscribe((reboot_prompt: string) => {
          this.dialogService.confirm(reboot, reboot_prompt).subscribe((reboot_res) => {
            if (reboot_res) {
              this.router.navigate(['/others/reboot']);
            }
          });
        });
      });
    })
    this.dialogRef.componentInstance.failure.subscribe((failure)=>{
      this.dialogRef.close(false);
      this.dialogService.errorReport(failure.error,failure.state,failure.exception)
    })

  }

updater(file: any, parent: any){
  const fileBrowser = file.fileInput.nativeElement;
  if (fileBrowser.files && fileBrowser.files[0]) {
    const formData: FormData = new FormData();
    formData.append('data', JSON.stringify({
      "method": "update.file",
      "params": [{"destination":this.fileLocation}]
    }));
    formData.append('file', fileBrowser.files[0]);
    parent.subs = {"apiEndPoint":file.apiEndPoint, "formData": formData}
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
