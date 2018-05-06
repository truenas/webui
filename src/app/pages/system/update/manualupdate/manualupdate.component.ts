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
import { MatDialog, MatDialogRef } from '@angular/material';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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

@Component({
  selector: 'app-manualupdate',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers : [ MessageService ]
})
export class ManualUpdateComponent {
  // protected tempfilelocation;
  // public filelocation;
  // public filename;
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
      // acceptedFiles: '.tar'
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
    entityForm.formGroup.controls['filelocation'].valueChanges.subscribe((res)=>{
      _.find(this.fieldConfig,{name:'filename'}).fileLocation = res;
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
      entityForm.snackBar.open(T("system successfully imported"), T("Success"));
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      entityForm.dialog.errorReport(res.error, res.reason, res.trace.formatted);
    });
  }

}
