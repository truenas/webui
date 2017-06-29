import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';
import {EntityConfigComponent} from '../../../common/entity/entity-config/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';

@Component({
  selector : 'webdav-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class ServiceWebdavComponent implements OnInit {

  protected resource_name: string = 'services/webdav';
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'webdav_protocol',
      placeholder : 'Protocol',
      options : [
        {label : 'HTTP', value : 'http'},
        {label : 'HTTPS', value : 'https'},
        {label : 'HTTP+HTTPS', value : 'httphttps'},
      ]
    },
    {
      type : 'input',
      name : 'webdav_tcpport',
      placeholder : 'HTTP Port',
    },
    {
      type : 'input',
      name : 'webdav_tcpportssl',
      placeholder : 'HTTPS Port',
    },
    {
      type : 'select',
      name : 'webdav_certssl',
      placeholder : 'Webdav SSL Certificate',
      options : []
    },
    {
      type : 'select',
      name : 'webdav_htauth',
      placeholder : 'HTTP Authentication',
      options : [
        {label : 'Basic Authentication', value : 'basic'},
        {label : 'Digest Authentication', value : 'digest'},
      ]
    },
    {
      type : 'input',
      name : 'webdav_password',
      placeholder : 'Webdav Password',
      inputType : 'password',
      validation : [ matchOtherValidator('webdav_password2') ]
    },
    {
      type : 'input',
      name : 'webdav_password2',
      placeholder : 'Confirm Password',
      inputType : 'password',
    },
  ];

  private webdav_certssl: any;

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      protected _state: GlobalState,
      protected systemGeneralService: SystemGeneralService,
  ) {}

  ngOnInit() {
    this.systemGeneralService.getCertificates().subscribe((res) => {
      this.webdav_certssl =
          _.find(this.fieldConfig, {'name' : 'webdav_certssl'});
      res.data.forEach((item) => {
        this.webdav_certssl.options.push(
            {label : item.cert_common, value : item.id});
      });
    });
  }

  afterInit(entityEdit: any) { this.entityEdit = entityEdit; }
}
