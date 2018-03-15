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
import { Subscription } from 'rxjs';
import { T } from '../../../../translate-marker';
import { RestService, WebSocketService } from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-certificate-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class CAFormComponent {

  protected resource_name: string = 'system/certificate';
  protected route_success: string[] = ['system', 'certificates'];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'cert_name',
      placeholder: T('Identifier'),
      tooltip: T('Enter a descriptive name for the certificate using only\
       alphanumeric, underscore (_), and dash (-) characters.')
    },
    {
      type: 'input',
      name: 'cert_certificate',
      placeholder: T('Certificate'),
      tooltip: T('Paste the contents of the certificate here.')
    },
    {
      type: 'input',
      name: 'cert_privatekey',
      placeholder: T('Private Key'),
      tooltip: T('Paste the contents of the private key here.')
    }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {}

  afterInit(entityEdit: any) {}
}
