import { ApplicationRef, Component, Injector } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_bootenv } from 'app/helptext/system/bootenv';
import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';

@Component({
   selector : 'bootenv-attach-form',
   template : `<entity-form [conf]="this"></entity-form>`
})

export class BootEnvAttachFormComponent {
  protected route_success: string[] = [ 'system', 'boot', 'status' ];
  protected isEntity: boolean = true;
  protected addCall = 'boot.attach';
  protected pk: any;
  protected isNew: boolean = true;
  protected dialogRef: any;


  protected entityForm: any;

  public fieldConfig: FieldConfig[] =[
    {
      type: 'select',
      name: 'dev',
      placeholder: helptext_system_bootenv.dev_placeholder,
      tooltip : helptext_system_bootenv.dev_tooltip,
      options :[]
    },
    {
      type: 'checkbox',
      name: 'expand',
      placeholder: helptext_system_bootenv.expand_placeholder,
      tooltip : helptext_system_bootenv.expand_tooltip,
    },

  ]
  protected diskChoice: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected dialog: MatDialog, public snackBar: MatSnackBar,) {}

preInit(entityForm: any) {
  this.route.params.subscribe(params => {
    this.pk = params['pk'];
  });
  this.entityForm = entityForm;
}

  afterInit(entityForm: any) {
    let disksize = 0
    this.entityForm = entityForm;
    this.diskChoice = _.find(this.fieldConfig, {'name':'dev'});
    this.ws.call('disk.get_unused').subscribe((res)=>{
      res.forEach((item) => {
        const disk_name = item.name
        disksize = (<any>window).filesize(item['size'], { standard: "iec" });
        item.name = `${item.name} (${disksize})`;
        this.diskChoice.options.push({label : item.name, value : disk_name});        
      });
    });

  }
  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action , {
      duration: 5000
    });
  }
  customSubmit(entityForm){
    const payload = {};
    payload['expand'] = entityForm.expand;
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Attach Device" }, disableClose: true });
    this.dialogRef.componentInstance.progressNumberType = "nopercent";
    this.dialogRef.componentInstance.setDescription("Attaching Device...");
    this.dialogRef.componentInstance.setCall('boot.attach', [entityForm.dev, payload]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.dialogRef.close(false);
      this.openSnackBar("Device attached.", "Success");
      this.router.navigate(
        new Array('').concat('system','boot')
      );
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.dialogRef.componentInstance.setDescription(res.error);
    });
  }

}
