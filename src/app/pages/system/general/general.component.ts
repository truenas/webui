import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

import { EntityConfigComponent } from '../../common/entity/entity-config/';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService, UserService } from '../../../services/';
import { FormGroup, FormArray, Validators, AbstractControl} from '@angular/forms';

import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-general',
  template: `
  <p>
    <button class="btn btn-outline-primary" (click)="gotoSaveConfig()">Save Config</button>
    <button class="btn btn-outline-warning" (click)="gotoUploadConfig()">Upload Config</button>
    <button class="btn btn-outline-danger" (click)="gotoResetConfig()">Reset Config</button>
    <button class="btn btn-outline-info" (click)="gotoNTPServers()">NTP Servers</button>
  </p>
  <entity-form [conf]="this"></entity-form>`
})
export class GeneralComponent {

  protected resource_name: string = 'system/settings';
  private entityEdit: EntityConfigComponent;

  protected fieldConfig: FieldConfig[] = [
    {
        type: 'select',
        name: 'stg_guiprotocol',
        placeholder: 'GUI Protocol',
        options: [
          { label: 'HTTP', value: 'http' },
          { label: 'HTTPS', value: 'https' },
          { label: 'HTTP+HTTPS', value: 'httphttps' },
        ],
    },
    {
        type: 'select',
        name: 'stg_guiaddress',
        placeholder: 'GUI IPv4 Bind Address',
        options: []
    },
    {
        type: 'select',
        name: 'stg_guiv6address',
        placeholder: 'GUI IPv6 Bind Address',
        options: []
    },
    {
        type: 'input',
        name: 'stg_guiport',
        placeholder: 'GUI HTTP Port',
    },
    {
        type: 'input',
        name: 'stg_guihttpsport',
        placeholder: 'GUI HTTPS Port',
    },
    {
        type: 'select',
        name: 'stg_guicertificate',
        placeholder: 'GUI SSL Certificate',
        options: []
    },
    {
        type: 'checkbox',
        name: 'stg_guihttpsredirect',
        placeholder: 'GUI HTTP -> HTTPS Redirect',
    },
    {
        type: 'select',
        name: 'stg_language',
        placeholder: 'GUI Language',
        options: []
    },
    {
        type: 'select',
        name: 'stg_kbdmap',
        placeholder: 'Console Keyboard map',
        options: []
    },
    {
        type: 'select',
        name: 'stg_timezone',
        placeholder: 'Timezone',
        options: []
    },
    {
        type: 'select',
        name: 'stg_sysloglevel',
        placeholder: 'Syslog Level',
        options: []
    },
    {
        type: 'input',
        name: 'stg_syslogserver',
        placeholder: 'Syslog Server',
    },
  ];

  private stg_guiaddress: any;
  private stg_guiv6address: any;
  private stg_guicertificate: any;
  private stg_language: any;
  private stg_kbdmap: any;
  private stg_timezone: any;
  private stg_sysloglevel: any;
  private stg_syslogserver: any;

  constructor(protected rest: RestService, protected router: Router) {

  }

  afterInit(entityEdit: any) {
    entityEdit.ws.call('certificate.query', [[['cert_CSR', '=', null]]]).subscribe((res) => {
      this.stg_guicertificate = _.find(this.fieldConfig, {'name': 'stg_guicertificate'});
      res.forEach((item) => {
        this.stg_guicertificate.options.push({ label: item.cert_name, value: item.id });
      });
    });

    entityEdit.ws.call('notifier.choices', ['IPChoices', [true, false]]).subscribe((res) => {
      this.stg_guiaddress = _.find(this.fieldConfig, {'name': 'stg_guiaddress'});
      this.stg_guiaddress.options.push({ label: '0.0.0.0', value: '0.0.0.0' });
      res.forEach((item) => {
        this.stg_guiaddress.options.push({ label: item[1], value: item[0] });
      });
    });

    entityEdit.ws.call('notifier.choices', ['IPChoices', [false, true]]).subscribe((res) => {
      this.stg_guiv6address = _.find(this.fieldConfig, {'name': 'stg_guiv6address'});
      this.stg_guiv6address.options.push({ label: '::', value: '::' });
      res.forEach((item) => {
        this.stg_guiv6address.options.push({ label: item[1], value: item[0] });
      });
    });

    entityEdit.ws.call('notifier.gui_languages').subscribe((res) => {
      this.stg_language = _.find(this.fieldConfig, {'name': 'stg_language'});
      res.forEach((item) => {
        this.stg_language.options.push({ label: item[1], value: item[0] });
      });
    });

    entityEdit.ws.call('notifier.choices', ['KBDMAP_CHOICES']).subscribe((res) => {
      this.stg_kbdmap = _.find(this.fieldConfig, {'name': 'stg_kbdmap'});
      res.forEach((item) => {
        this.stg_kbdmap.options.push({ label: item[1], value: item[0] });
      });
    });

    entityEdit.ws.call('notifier.choices', ['TimeZoneChoices']).subscribe((res) => {
      this.stg_timezone = _.find(this.fieldConfig, {'name': 'stg_timezone'});
      res.forEach((item) => {
        this.stg_timezone.options.push({ label: item[1], value: item[0] });
      });
    });

    entityEdit.ws.call('notifier.choices', ['SYS_LOG_LEVEL']).subscribe((res) => {
      this.stg_sysloglevel = _.find(this.fieldConfig, {'name': 'stg_sysloglevel'});
      res.forEach((item) => {
        this.stg_sysloglevel.options.push({ label: item[1], value: item[0] });
      });
    });

  }

  gotoSaveConfig() {
    this.router.navigate(new Array('/pages').concat(['system', 'general', 'config-save']));
  }

  gotoUploadConfig() {
    this.router.navigate(new Array('/pages').concat(['system', 'general', 'config-upload']));
  }

  gotoResetConfig() {
    this.router.navigate(new Array('/pages').concat(['system', 'general', 'config-reset']));
  }

  gotoNTPServers() {
    this.router.navigate(new Array('/pages').concat(['system', 'ntpservers']));
  }

}
