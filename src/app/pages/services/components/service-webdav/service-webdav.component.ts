import {ApplicationRef, Component, Injector, OnInit, OnDestroy} from '@angular/core';
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
import { T } from '../../../../translate-marker';

@Component({
  selector : 'webdav-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class ServiceWebdavComponent implements OnInit, OnDestroy {

  protected resource_name: string = 'services/webdav';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'webdav_protocol',
      placeholder : T('Protocol'),
      tooltip : T('Choose <i>HTTP</i> to keep the connection always\
       unencrypted, <i>HTTPS</i> keeps the connection encrypted, or select\
       <i>HTTP+HTTPS</i> to allow both types of connections.'),
      options : [
        {label : 'HTTP', value : 'http'},
        {label : 'HTTPS', value : 'https'},
        {label : 'HTTP+HTTPS', value : 'httphttps'},
      ]
    },
    {
      type : 'input',
      name : 'webdav_tcpport',
      placeholder : T('HTTP Port'),
      tooltip : T('Specify the port for unencrypted connections. The\
       default port <i>8080</i> is recommended. Do not use a port number\
       already in use by another service.'),
    },
    {
      type : 'input',
      name : 'webdav_tcpportssl',
      placeholder : T('HTTPS Port'),
      tooltip : T('Specify the port for encrypted connections. The\
       default port <i>8081</i> is recommended. Do not use a port number\
       already in use by another service.'),
    },
    {
      type : 'select',
      name : 'webdav_certssl',
      placeholder : T('Webdav SSL Certificate'),
      tooltip : T('Select the SSL certificate to use for encrypted\
       connections. Navigate to the <b>System -> Certificates</b> page to\
       create a certificate.'),
      options: [
        {label: '---', value: null}
      ]
    },
    {
      type : 'select',
      name : 'webdav_htauth',
      placeholder : T('HTTP Authentication'),
      tooltip : T('<i>Basic Authentication</i> is unencrypted.\
       <i>Digest Authentication</i> is encrypted.'),
      options : [
        {label : 'No Authentication', value: 'none'},
        {label : 'Basic Authentication', value : 'basic'},
        {label : 'Digest Authentication', value : 'digest'},
      ]
    },
    {
      type : 'input',
      name : 'webdav_password',
      placeholder : T('Webdav Password'),
      tooltip : T('The default is <i>davtest</i>. It is recommended to\
       change the password as the default is a known value.'),
      inputType : 'password',
      validation : [ matchOtherValidator('webdav_password2') ]
    },
    {
      type : 'input',
      name : 'webdav_password2',
      placeholder : T('Confirm Password'),
      inputType : 'password',
    },
  ];

  private webdav_protocol: any;
  private webdav_protocol_subscription: any;
  private webdav_tcpport: any;
  private webdav_tcpportssl: any;
  private webdav_certssl: any;
  private webdav_htauth: any;
  private webdav_htauth_subscription: any;
  private webdav_password: any;
  private webdav_password2: any;

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

  resourceTransformIncomingRestData(data) {
    delete(data['webdav_password']);
    return data;
  }

  afterInit(entityForm: any) {
    this.webdav_tcpport = _.find(this.fieldConfig, {'name': 'webdav_tcpport'});
    this.webdav_tcpportssl = _.find(this.fieldConfig, {'name': 'webdav_tcpportssl'});
    this.webdav_password = _.find(this.fieldConfig, {'name': 'webdav_password'});
    this.webdav_password2 = _.find(this.fieldConfig, {'name': 'webdav_password2'});
    this.webdav_htauth = entityForm.formGroup.controls['webdav_htauth'];
    this.webdav_protocol = entityForm.formGroup.controls['webdav_protocol'];
    this.handleProtocol(this.webdav_protocol.value);
    this.handleAuth(this.webdav_htauth.value);
    this.webdav_protocol_subscription = this.webdav_protocol.valueChanges.subscribe((value) => {
      this.handleProtocol(value);
    });
    this.webdav_htauth_subscription = this.webdav_htauth.valueChanges.subscribe((value) => {
      this.handleAuth(value); 
    });
  }

  handleProtocol(value: any) {
    if (value === 'http') {
      this.webdav_tcpport.isHidden = false;
      this.webdav_tcpportssl.isHidden = true;
      this.webdav_certssl.isHidden = true;
    } else if (value === 'https') {
      this.webdav_tcpport.isHidden = true;
      this.webdav_tcpportssl.isHidden = false;
      this.webdav_certssl.isHidden = false;
    } else if (value === 'httphttps') {
      this.webdav_tcpport.isHidden = false;
      this.webdav_tcpportssl.isHidden = false;
      this.webdav_certssl.isHidden = false;
    }
  }

  handleAuth(value: any) {
    if (value === 'none') {
      this.webdav_password.isHidden = true;
      this.webdav_password2.isHidden = true;
    } else {
      this.webdav_password.isHidden = false;
      this.webdav_password2.isHidden = false;
    }
  }

  ngOnDestroy() {
    this.webdav_protocol_subscription.unsubscribe();
    this.webdav_htauth_subscription.unsubscribe();
  }
}
