import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import { MatDialog, MatDialogRef,MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs/Subscription';
import { RestService, WebSocketService } from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import {MessageService} from '../../../common/entity/entity-form/services/message.service';
import { CoreService } from '../../../../core/services/core.service';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { DialogService } from '../../../../services/dialog.service';
import { updateLocale } from 'moment';

@Component({
  selector: 'app-manualupdate',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers : [ MessageService ]
})
export class ManualUpdateComponent {
  public formGroup: FormGroup;
  public route_success: string[] = ['system','update'];
  protected dialogRef: any;
  public custActions: Array < any > = [{
    id: 'save_config',
    name: 'Save Config',
    function: () => {
      this.router.navigate([this.router.url+'/saveconfig']);
    }
  }]
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
      validation : [ ],
      fileLocation: '',
      message: this.messageService,
      acceptedFiles: '.tar'
    },
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    public messageService: MessageService,
    protected dialog: MatDialog,
    public snackBar: MatSnackBar,
    public translate: TranslateService,
    private dialogService: DialogService,
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
      /* create temp filelocation */
      if(filelocation === ":temp:"){
        this.ws.call('notifier.destroy_upload_location').subscribe(destroy_upload_location=>{
          if(!destroy_upload_location){
            /* create temp filelocation  if destroy_upload_location => false */
            this.ws.call('notifier.create_upload_location').subscribe((create_upload_location)=>{
              this.ws.call('notifier.get_update_location').subscribe((get_update_location)=>{
                 /* get temp filelocation  and set it to the fileLocation */
                _.find(this.fieldConfig,{name:'filename'}).fileLocation = get_update_location;

              })
            })

          };
        });
      } else {
        this.ws.call('notifier.destroy_upload_location').subscribe(destroy_upload_location=>{
          _.find(this.fieldConfig,{name:'filename'}).fileLocation = filelocation;
        })
      };
    });
    this.messageService.messageSourceHasNewMessage$.subscribe((message)=>{
      entityForm.formGroup.controls['filename'].setValue(message);
    });
    entityForm.submitFunction = this.customSubmit;
  }
  customSubmit(entityForm: any) {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Manual Update") }});
    this.dialogRef.componentInstance.progressNumberType = "nopercent";
    this.dialogRef.componentInstance.setDescription(T("Updating..."));
    this.dialogRef.componentInstance.setCall('update.manual', [entityForm.filename]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      entityForm.success = true;
      this.translate.get('Restart').subscribe((reboot: string) => {
        this.translate.get('The update has been successfully applied, it is recommended that you reboot the machine now for the update to take effect. Do you wish to reboot?').subscribe((reboot_prompt: string) => {
          this.dialogService.confirm(reboot, reboot_prompt).subscribe((reboot_res) => {
            if (reboot_res) {
              this.router.navigate(['/others/reboot']);
            }
          });
        });
      });
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      entityForm.dialog.errorReport(res.error, res.reason, res.trace.formatted);
    });
  }

}
