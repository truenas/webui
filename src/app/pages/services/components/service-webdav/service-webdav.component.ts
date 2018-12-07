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

  //protected resource_name: string = 'services/webdav';
  protected queryCall: string = 'webdav.config';
  protected editCall: string = 'webdav.update';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'protocol',
      placeholder : T('Protocol'),
      tooltip : T('<i>HTTP</i> will keep the connection unencrypted.\
                   <i>HTTPS</i> encrypts the connection.\
                   <i>HTTP+HTTPS</i> allows both types of connections.'),
      options : [
        {label : 'HTTP', value : 'HTTP'},
        {label : 'HTTPS', value : 'HTTPS'},
        {label : 'HTTP+HTTPS', value : 'HTTPHTTPS'},
      ]
    },
    {
      type : 'input',
      name : 'tcpport',
      placeholder : T('HTTP Port'),
      tooltip : T('Specify a port for unencrypted connections. The\
                   default port <i>8080</i> is recommended. Do not reuse\
                   a port.'),
    },
    {
      type : 'input',
      name : 'tcpportssl',
      placeholder : T('HTTPS Port'),
      tooltip : T('Specify a port for encrypted connections. The\
                   default port <i>8081</i> is recommended. Do not reuse\
                   a port.'),
    },
    {
      type : 'select',
      name : 'certssl',
      placeholder : T('Webdav SSL Certificate'),
      tooltip : T('Select the <a href="%%docurl%%/system.html%%webversion%%#certificates"\
                   target="_blank">SSL certificate</a> to use for\
                   encrypted connections.'),
      options: [
        {label: '---', value: null}
      ]
    },
    {
      type : 'select',
      name : 'htauth',
      placeholder : T('HTTP Authentication'),
      tooltip : T('<i>Basic Authentication</i> is unencrypted.\
                   <i>Digest Authentication</i> is encrypted.'),
      options : [
        {label : 'No Authentication', value: 'NONE'},
        {label : 'Basic Authentication', value : 'BASIC'},
        {label : 'Digest Authentication', value : 'DIGEST'},
      ]
    },
    {
      type : 'input',
      name : 'password',
      placeholder : T('Webdav Password'),
      togglePw: true,
      tooltip : T('The default of <i>davtest</i> is recommended to\
                   change. <i>davtest</i> is a known value.'),
      inputType : 'password',
      value : 'davtest',
      validation : [ matchOtherValidator('password2') ]
    },
    {
      type : 'input',
      name : 'password2',
      placeholder : T('Confirm Password'),
      inputType : 'password'
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
  private entityForm: any;

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
    this.webdav_certssl =
      _.find(this.fieldConfig, {'name' : 'certssl'});
    this.systemGeneralService.getCertificates().subscribe((res) => {
      if (res.length > 0) {
        res.forEach((item) => {
          this.webdav_certssl.options.push(
              {label : item.name, value : item.id});
        });
      }
    });
  }

  resourceTransformIncomingRestData(data) {
    const certificate = data['certssl'];
    if (certificate && certificate.id) {
      data['certssl'] = certificate.id;
    }
    delete data['password'];
    return data;
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.entityForm.submitFunction = this.submitFunction;
    this.webdav_tcpport = _.find(this.fieldConfig, {'name': 'tcpport'});
    this.webdav_tcpportssl = _.find(this.fieldConfig, {'name': 'tcpportssl'});
    this.webdav_password = _.find(this.fieldConfig, {'name': 'password'});
    this.webdav_password2 = _.find(this.fieldConfig, {'name': 'password2'});
    this.webdav_htauth = entityForm.formGroup.controls['htauth'];
    this.webdav_protocol = entityForm.formGroup.controls['protocol'];
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
    if (value === 'HTTP') {
      this.webdav_tcpport['isHidden'] = false;
      this.webdav_tcpportssl['isHidden'] = true;
      this.webdav_certssl['isHidden'] = true;
    } else if (value === 'HTTPS') {
      this.webdav_tcpport['isHidden'] = true;
      this.webdav_tcpportssl['isHidden'] = false;
      this.webdav_certssl['isHidden'] = false;
    } else if (value === 'HTTPHTTPS') {
      this.webdav_tcpport['isHidden'] = false;
      this.webdav_tcpportssl['isHidden'] = false;
      this.webdav_certssl['isHidden'] = false;
    }
  }

  handleAuth(value: any) {
    if (value === 'NONE') {
      this.entityForm.setDisabled('password', true, true);
      this.entityForm.setDisabled('password2', true, true);
    } else {
      this.entityForm.setDisabled('password', false, false);
      this.entityForm.setDisabled('password2', false, false);
    }
  }

  ngOnDestroy() {
    this.webdav_protocol_subscription.unsubscribe();
    this.webdav_htauth_subscription.unsubscribe();
  }

  submitFunction(this: any, body: any,){
    delete body['password2'];
    return this.ws.call('webdav.update', [body]);
  }
}
