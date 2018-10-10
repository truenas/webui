import {
  ApplicationRef,
  Component,
  Injector
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../../services/rest.service';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { WebSocketService } from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/storage/volumes/volume_delete';

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
      label: helptext.volume_delete_name_label,
      isHidden: true
    }, {
      type: 'checkbox',
      name: 'destroy',
      label: helptext.volume_delete_destroy_label,
      value: false,
      placeholder: helptext.volume_delete_destroy_placeholder,
      tooltip: helptext.volume_delete_destroy_tooltip

    }, {
      type: 'checkbox',
      name: 'confirm_detach_checkbox',
      label: helptext.volume_delete_confirm_detach_checkbox_label,
      placeholder: helptext.volume_delete_confirm_detach_checkbox_placeholder,
      tooltip: helptext.volume_delete_confirm_detach_checkbox_tooltip,
      validation: helptext.volume_delete_confirm_detach_checkbox_validation,
      required: true

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
        this.dialogService.Info(T("Detach Pool"), T("Successfully detached pool ") + value.name);

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
        this.dialogService.Info(T("Detach Pool"), T("Successfully detached pool ") + value.name + T(". All data on that pool was destroyed."));

        this.router.navigate(new Array('/').concat(
          this.route_success));
      }, (res) => {
        this.loader.close();
        this.dialogService.errorReport(T("Error detaching pool"), res.message, res.stack);
      });
    }


  }

}



