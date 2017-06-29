import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, FormArray, Validators, AbstractControl} from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { EntityConfigComponent } from '../../../common/entity/entity-config/';

import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';

@Component({
  selector: 'system-ca-import',
  template: `<entity-form [conf]="this"></entity-form>`,
})

export class CertificateAuthorityImportComponent {

  protected resource_name: string = 'system/certificateauthority/import';
  protected route_success: string[] = ['system','ca'];
<<<<<<< HEAD
  public formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
        id: 'cert_name',
        label: 'Identifier',
    }),
    new DynamicTextAreaModel({
        id: 'cert_certificate',
        label: 'Certificate',
    }),
    new DynamicTextAreaModel({
        id: 'cert_privatekey',
        label: 'Private Key',
    }),
    new DynamicInputModel({
        id: 'Passphrase',
        label: 'Passphrase',
    }),
    new DynamicInputModel({
        id: 'Passphrase2',
        label: 'Confirm Passphrase',
    }),
    new DynamicInputModel({
        id: 'cert_serial',
        label: 'Serial',
    }),
  ];

  afterInit() {
    this.route.params.subscribe(params => {
    });
  }
=======
  protected isEntity: boolean = true;
>>>>>>> cc462787f7bb9fefc93823f47db32f6623176ade

  protected fieldConfig: FieldConfig[] = [
    {
        type: 'input',
        name: 'cert_name',
        placeholder: 'Identifier',
    },
    {
        type: 'textarea',
        name: 'cert_certificate',
        placeholder: 'Certificate',
    },
    {
        type: 'textarea',
        name: 'cert_privatekey',
        placeholder: 'Private Key',
    },
    {
        type: 'input',
        name: 'Passphrase',
        placeholder: 'Passphrase',
        inputType: 'password',
        validation: [
          matchOtherValidator('Passphrase2')
        ]
    },
    {
        type: 'input',
        name: 'Passphrase2',
        inputType: 'password',
        placeholder: 'Confirm Passphrase',
    },
    {
        type: 'input',
        name: 'cert_serial',
        placeholder: 'Serial',
    },
  ];

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
