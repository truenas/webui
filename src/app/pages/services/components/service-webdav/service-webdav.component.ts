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

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';
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
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'webdav_protocol',
      placeholder : 'Protocol',
      tooltip : 'Choose <i>HTTP</i> to keep the connection always\
 unencrypted, <i>HTTPS</i> keeps the connection encrypted, or select\
 <i>HTTP+HTTPS</i> to allow both types of connections.',
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
      tooltip : 'Specify the port for unencrypted connections. The\
 default port <i>8080</i> is recommended. Do not use a port number\
 already in use by another service.',
    },
    {
      type : 'input',
      name : 'webdav_tcpportssl',
      placeholder : 'HTTPS Port',
      tooltip : 'Specify the port for encrypted connections. The\
 default port <i>8081</i> is recommended. Do not use a port number\
 already in use by another service.',
    },
    {
      type : 'select',
      name : 'webdav_certssl',
      placeholder : 'Webdav SSL Certificate',
      tooltip : 'Select the SSL certificate to use for encrypted\
 connections. Navigate to the <b>System -> Certificates</b> page to\
 create a certificate.',
      options: [
        {label: '---', value: null}
      ]
    },
    {
      type : 'select',
      name : 'webdav_htauth',
      placeholder : 'HTTP Authentication',
      tooltip : '<i>Basic Authentication</i> is unencrypted.\
 <i>Digest Authentication</i> is encrypted.',
      options : [
        {label : 'Basic Authentication', value : 'basic'},
        {label : 'Digest Authentication', value : 'digest'},
      ]
    },
    {
      type : 'input',
      name : 'webdav_password',
      placeholder : 'Webdav Password',
      tooltip : 'The default is <i>davtest</i>. It is recommended to\
 change the password as the default is a known value.',
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
      protected systemGeneralService: SystemGeneralService,
  ) {}

  ngOnInit() {
    this.systemGeneralService.getCertificates().subscribe((res) => {
      this.webdav_certssl =
          _.find(this.fieldConfig, {'name' : 'webdav_certssl'});
      res.forEach((item) => {
        this.webdav_certssl.options.push(
            {label : item.cert_common, value : item.id});
      });
    });
  }

  afterInit(entityForm: any) {
    entityForm.formGroup.controls['webdav_password2'].setValue('davtest');
  }
}
