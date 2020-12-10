import { Component } from '@angular/core';
import { WebSocketService } from 'app/services/';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { MatDialog } from '@angular/material/dialog';
import {EntityUtils} from 'app/pages/common/entity/utils';


@Component({
  selector: 'app-production-status',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class ProductionStatusComponent {
  public saveSubmitText = helptext.is_production_submit;
  public entityEdit: any;
  public isProduction: boolean;
  public dialogRef: any;
  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: 'col1',
      label: false,
      config:[
        {
          type: 'checkbox',
          name: 'production',
          placeholder: helptext.is_production_checkbox.placeholder,
          tooltip: helptext.is_production_checkbox.tooltip,
          tooltipPosition: 'above',
          value: false
        },
        {
          type: 'checkbox',
          name: 'send_debug',
          placeholder: helptext.is_production_debug.placeholder,
          tooltip: helptext.is_production_debug.tooltip,
          tooltipPosition: 'above',
          value: false,
          relation : [
            {
              action : 'SHOW',
              when : [ {
                name : 'production',
                value : true
              } ]
            },
          ]
        },
      ]
    }
  ]

  constructor(public ws: WebSocketService, protected dialogService: DialogService, 
    protected loader: AppLoaderService, protected dialog: MatDialog) { }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    setTimeout(() => {
      this.ws.call('truenas.is_production').subscribe((res) => {
        this.isProduction = res;
        this.entityEdit.formGroup.controls['production'].setValue(this.isProduction);
      });
    }, 500)

  };

  customSubmit(data) {
    if (!data.send_debug) {
      data.send_debug = false;
    }
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": helptext.is_production_job.title }});
    this.dialogRef.componentInstance.setDescription(helptext.is_production_job.message);

    this.dialogRef.componentInstance.setCall('truenas.set_production', [data.production, data.send_debug]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.dialogRef.close();
      this.dialogService.Info(helptext.is_production_dialog.title, 
        helptext.is_production_dialog.message, '300px', 'info', true);
    });
    this.dialogRef.componentInstance.failure.subscribe((err) => {
      this.dialogRef.close();
      new EntityUtils().handleWSError(this.entityEdit, err, this.dialogService);
    });

  };
}
