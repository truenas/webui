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
  WebSocketService,
  UserService
} from '../../../../services';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';
import { T } from '../../../../translate-marker';
import { parse } from 'path';

@Component({
  selector : 'tftp-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceTFTPComponent {

  protected resource_name: string = 'services/tftp';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      explorerType: 'directory',
      name : 'tftp_directory',
      placeholder : T('Directory'),
      tooltip : T('Browse to an <b>existing</b> directory to use for\
                   storage. Some devices can require a specific\
                   directory name. Consult the documentation for that\
                   device to see if there are any restrictions.'),
    },
    {
      type : 'checkbox',
      name : 'tftp_newfiles',
      placeholder : T('Allow New Files'),
      tooltip : T('Set when network devices need to send files to\
                   the system.'),
    },
    {
      type : 'input',
      name : 'tftp_port',
      placeholder : T('Port'),
      tooltip : T('Enter a UDP prort to listen for TFTP requests.'),
    },
    {
      type : 'combobox',
      name : 'tftp_username',
      placeholder : T('Username'),
      tooltip : T('Select the account to use for TFTP requests. This\
                   account must have permission to the <b>Directory</b>.'),
      options : []
    },
    {
      type : 'permissions',
      name : 'tftp_umask',
      noexec: true,
      placeholder : T('File Permissions'),
      tooltip : T('Adjust the file permissions using the checkboxes.'),
    },
    {
      type : 'textarea',
      name : 'tftp_options',
      placeholder : T('Extra options'),
      tooltip : T('Add more options from <a\
                   href="https://www.freebsd.org/cgi/man.cgi?query=tftpd"\
                   target="_blank">tftpd(8)</a>. Add one option on each\
                   line.'),
    },
  ];

  protected tftp_username: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected userService: UserService) {}

  resourceTransformIncomingRestData(data: any) {
    let perm = parseInt(data['tftp_umask'], 8);
    let mask = (~perm & 0o666).toString(8);
    while (mask.length < 3) {
      mask = '0' + mask;
    }
    data['tftp_umask'] = mask;

    return data;
  }

  preInit(entityEdit: any) {
    this.userService.listAllUsers().subscribe(res => {
      let users = [];
      let items = res.data.items;
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].label, value: items[i].id});
      }
      this.tftp_username = _.find(this.fieldConfig, {'name' : 'tftp_username'});
      this.tftp_username.options = users;
    });
  }

  afterInit(entityEdit: any) { }
}
