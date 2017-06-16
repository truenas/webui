import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService, SystemGeneralService} from '../../../../services/';
import { FormGroup, FormArray, Validators, AbstractControl} from '@angular/forms';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';

@Component ({
    selector: 's3-edit',
    template: `<entity-form [conf]="this"></entity-form>`,
    providers: [ SystemGeneralService ]
})

export class ServiceS3Component implements OnInit {
  protected resource_name: string = 'services/s3';
  protected route_success: string[] = ['services'];
  private entityEdit: EntityConfigComponent;

  protected fieldConfig: FieldConfig[] = [
    {
        type: 'select',
        name: 's3_bindip',
        placeholder: 'IP Address',
        options: []
    },
    {
        type: 'input',
        name: 's3_bindport',
        placeholder: 'Port',
    },
    {
        type: 'input',
        name: 's3_access_key',
        placeholder: 'Access Key',
    },
    {
        type: 'input',
        name: 's3_secret_key',
        placeholder: 'Secret Key',
        inputType: 'password'
    },
    {
        type: 'input',
        name: 's3_secret_key2',
        placeholder: 'Confirm S3 Key',
        inputType: 'password'
    },
    {
        type: 'input',
        name: 's3_disks',
        placeholder: 'Disk',
    },
    {
        type: 'checkbox',
        name: 's3_browser',
        placeholder: 'Enable Browser',
    },
    {
        type: 'select',
        name: 's3_mode',
        placeholder: 'Mode',
        options: [
          { label: "local"},
        ]
    },
  ];
  
  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected _state: GlobalState,
    protected systemGeneralService: SystemGeneralService) {
  }

  ngOnInit() {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



