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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs/Subscription';
import { RestService, WebSocketService } from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-manualupdate',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class ManualUpdateComponent {
  // protected tempfilelocation;
  // public filelocation;
  // public filename;
  public formGroup: FormGroup;
  public route_success: string[] = ['system','update'];
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
    },
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef
  ) {}

  preInit(entityForm: any) {
    // this.tempfilelocation = _.find(this.fieldConfig, {'name' : 'filelocation'});
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
    // this.filelocation = entityForm.formGroup.controls['filelocation'];
    // this.filename =  entityForm.formGroup.controls['filename'];
    entityForm.formGroup.controls['filelocation'].valueChanges.subscribe((res)=>{
      _.find(this.fieldConfig,{name:'filename'}).fileLocation = res;
    });
    entityForm.submitFunction = this.submitFunction;
  }
  submitFunction(entityForm: any) {
    console.log(entityForm);
  }

}
