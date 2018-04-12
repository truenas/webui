import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../../services/rest.service';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { WebSocketService } from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { T } from '../../../../translate-marker';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-volume-delete',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class VolumeDeleteComponent implements Formconfiguration {

  saveSubmitText = T("Detach");

  resource_name = 'storage/volume';
  route_success: string[] = ['storage', 'pools'];
  isNew = false;
  isEntity = true;

  fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      label: T('name'),
      isHidden: true
    }, {
      type: 'checkbox',
      name: 'destroy',
      label: T('destroy'),
      value: false,
      placeholder: T("Destroy the pool's data?"),
      tooltip: T("(Checking this will result in deleting the pool, \
           if you leave this unchecked pool will be exported and the \
           data will remain intact)")

    }, {
      type: 'checkbox',
      name: 'confirm',
      label: T("Confirm it's ok to proceed with Detach."),
      placeholder: T("Confirm this detach procedure."),
      tooltip: T("Checking this will in the pool being detached.  If you selected Detroy the data will be gone."),
      validation: [Validators.required],
      required: true,

    }
  ];

  resourceTransformIncomingRestData(data: any): any {
    return data;
  };


  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected dialogService: DialogService,
    protected loader: AppLoaderService
  ) {

  }

  afterInit(entityForm: any) {

  }

  customSubmit(value) {
    this.loader.open();
    if (value.destroy === false) {
      return this.rest.delete(this.resource_name + "/" + value.name, { body: JSON.stringify({ destroy: value.destroy }) }).subscribe((restPostResp) => {
        console.log("restPostResp", restPostResp);
        this.loader.close();
        this.dialogService.Info(T("Detach/Delete Pool"), T("Successfully detached pool") + value.name);

        this.router.navigate(new Array('/').concat(
          this.route_success));
      }, (res) => {
        this.loader.close();
        this.dialogService.errorReport(T("Error detaching pool"), res.message, res.stack);
      });
    } else {
      return this.rest.delete(this.resource_name + "/" + value.name, { body: JSON.stringify({}) }).subscribe((restPostResp) => {
        console.log("restPostResp", restPostResp);
        this.loader.close();
        this.dialogService.Info(T("Detach/Delete Pool"), T("Successfully deleted pool ") + value.name);

        this.router.navigate(new Array('/').concat(
          this.route_success));
      }, (res) => {
        this.loader.close();
        this.dialogService.errorReport(T("Error deleting pool"), res.message, res.stack);
      });
    }


  }

}




