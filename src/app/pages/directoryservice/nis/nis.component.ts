import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';


import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../services/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'nis',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class NISComponent {
  protected resource_name: string = 'directoryservice/nis/';

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'nis_domain',
      placeholder : 'NIS domain:',
      tooltip: 'Name of NIS domain.',
    },
    {
      type : 'input',
      name : 'nis_servers',
      placeholder : 'NIS servers:',
      tooltip : 'Comma delimited list of hostnames or IP addresses.'
    },
    {
      type : 'checkbox',
      name : 'nis_secure_mode',
      placeholder : 'Secure mode',
      tooltip : 'If checked,\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=ypbind"\
 target="_blank">ypbind(8)</a> refuses to bind to any NIS server that\
 is not running as root on a TCP port number over 1024.'
    },
    {
      type : 'checkbox',
      name : 'nis_manycast',
      placeholder : 'Manycast',
      tooltip : 'If checked, ypbind binds to the server that responds\
 the fastest. This is useful when no local NIS server is available on\
 the same subnet.'
    },
    {
      type : 'checkbox',
      name : 'nis_enable',
      placeholder : 'Enable',
      tooltip : 'Uncheck to disable the configuration without deleting it.'
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected systemGeneralService: SystemGeneralService) {}
}
