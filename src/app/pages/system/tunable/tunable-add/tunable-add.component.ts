import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, FormArray, Validators, AbstractControl} from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { EntityConfigComponent } from '../../../common/entity/entity-config/';

import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

@Component({
  selector: 'system-tunable-add',
  template: `<entity-form [conf]="this"></entity-form>`
})

export class TunableAddComponent {

  protected resource_name: string = 'system/tunable';
  protected route_success: string[] = ['system', 'tunable'];
  protected isEntity: boolean = true;
  protected fieldConfig: FieldConfig[] = [
    {
        type: 'input',
        name: 'tun_var',
        placeholder: 'Variable',
    },
    {
        type: 'textarea',
        name: 'tun_value',
        placeholder: 'Value',
    },
    {
        type: 'select',
        name: 'tun_type',
        placeholder: 'Type',
        options: [
            {label: 'Loader', value: 'loader'},
            {label: 'rc.conf', value: 'rc'},
            {label: 'Sysctl', value: 'sysctl'},
        ]
    },
    {
        type: 'input',
        name: 'tun_comment',
        placeholder: 'Comment',
    },
    {
        type: 'checkbox',
        name: 'tun_enabled',
        placeholder: 'Enable',
    },
  ];

  afterInit() {
    this.route.params.subscribe(params => {
    });
  }

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected _state: GlobalState
  ) {}

}
