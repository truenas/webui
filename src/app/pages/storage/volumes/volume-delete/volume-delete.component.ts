import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { WebSocketService } from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';

@Component({
  selector : 'app-volume-delete',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class VolumeDeleteComponent implements Formconfiguration {

    saveSubmitText = "Detach"; 
  
    resource_name = 'storage/volume';
    route_success: string[] = [ 'storage', 'volumes'];
    isNew = false;
    isEntity = true;
    
    fieldConfig: FieldConfig[] = [
      {
        type : 'input',
        name : 'name',
        isHidden: true
      },{
        type : 'checkbox',
        name : 'destroy',
        value : false,
        placeholder : "Destroy the Volumes data ?",
        tooltip: "(unchecked means leave alone/intact)"
        
      },{
        type : 'checkbox',
        name : 'cascade',
        value : false,
        placeholder: 'Destroy the shares related to the volume ?',
        tooltip: '(unchecked means leave alone/intact)'
      }
    ];
  
    resourceTransformIncomingRestData(data:any): any {
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
      
      return this.rest.delete(this.resource_name + "/" + value.name, { body: JSON.stringify({destroy: value.destroy, cascade: value.cascade }) }).subscribe((restPostResp) => {
        console.log("restPostResp", restPostResp);
        this.loader.close();
        this.dialogService.Info("Detached/Deleted Volume", "Successfully Detached volume " + value.name);
  
        this.router.navigate(new Array('/').concat(
          ["storage", "volumes"]));
      }, (res) => {
        this.loader.close();
        this.dialogService.errorReport("Error Detaching volume", res.message, res.stack);
      });
    }
    
  }
  
  


