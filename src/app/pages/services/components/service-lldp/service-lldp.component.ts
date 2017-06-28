import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService} from '../../../../services/';
import { FormGroup, FormArray, Validators, AbstractControl} from '@angular/forms';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';


@Component ({
    selector: 'lldp-edit',
    template: `<entity-form [conf]="this"></entity-form>`
})

export class ServiceLLDPComponent {
  protected resource_name: string = 'services/lldp';
  protected route_success: string[] = ['services'];

  private entityEdit: EntityConfigComponent;

  public fieldConfig: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'lldp_intdesc',
      placeholder: 'Interface Description',
    },
    {
      type: 'input',
      name: 'lldp_country',
      placeholder: 'Country Code',
    },
    {
      type: 'input',
      name: 'lldp_location',
      placeholder: 'Location',
    },
  ];
  
  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected _state: GlobalState) {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



