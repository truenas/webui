import { Component } from '@angular/core';
import { WebSocketService } from 'app/services/';
import { SnackbarService } from 'app/services/snackbar.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_support as helptext } from 'app/helptext/system/support';

@Component({
  selector: 'app-production-status',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class ProductionStatusComponent {
  public saveSubmitText = helptext.is_production_submit;
  public entityEdit: any;
  public isProduction: boolean;
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
          value: false
        },
        {
          type: 'checkbox',
          name: 'send_debug',
          placeholder: helptext.is_production_debug.placeholder,
          tooltip: helptext.is_production_debug.tooltip,
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

  constructor(public ws: WebSocketService, public snackBar: SnackbarService,
    protected dialogService: DialogService, protected loader: AppLoaderService) { }

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
    this.ws.call('truenas.set_production', [data.production, data.send_debug]).subscribe(() => {
      this.snackBar.open(helptext.is_production_snackbar.message, 
        helptext.is_production_snackbar.action, {duration: 4000});
    },
    (err) => {
      this.loader.close();
      this.dialogService.errorReport(helptext.is_production_error_dialog.title,
        err.error.message, err.error.traceback);
    });

  };
}
