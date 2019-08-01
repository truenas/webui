import { ApplicationRef, Component, Injector, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, SystemGeneralService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-webdav';

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
      placeholder : helptext.protocol_placeholder,
      tooltip : helptext.protocol_tooltip,
      options : helptext.protocol_options
    },
    {
      type : 'input',
      name : 'tcpport',
      placeholder : helptext.tcpport_placeholder,
      tooltip : helptext.tcpport_tooltip,
    },
    {
      type : 'input',
      name : 'tcpportssl',
      placeholder : helptext.tcpportssl_placeholder,
      tooltip : helptext.tcpportssl_tooltip,
    },
    {
      type : 'select',
      name : 'certssl',
      placeholder : helptext.certssl_placeholder,
      tooltip : helptext.certssl_tooltip,
      options: helptext.certssl_options
    },
    {
      type : 'select',
      name : 'htauth',
      placeholder : helptext.htauth_placeholder,
      tooltip : helptext.htauth_tooltip,
      options : helptext.htauth_options
    },
    {
      type : 'input',
      name : 'password',
      placeholder : helptext.password_placeholder,
      togglePw: true,
      tooltip : helptext.password_tooltip,
      inputType : 'password',
      validation : helptext.password_validation
    },
    {
      type : 'input',
      name : 'password2',
      placeholder : helptext.password2_placeholder,
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
