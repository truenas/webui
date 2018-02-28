import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { RestService, UserService, WebSocketService } from '../../../services/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html'
})
export class GeneralComponent {

  protected resource_name: string = 'system/settings';

  public fieldConfig: FieldConfig[] = [{
      type: 'select',
      name: 'stg_guiprotocol',
      placeholder: 'Protocol',
      tooltip: 'Define the web protocol to use when connecting to the\
 administrative GUI from a browser. To change the default <i>HTTP</i> to\
 <i>HTTPS</i> or <i>HTTP+HTTPS</i>, a <b>Certificate</b> must also be\
 chosen.',
      options: [
        { label: 'HTTP', value: 'http' },
        { label: 'HTTPS', value: 'https' },
        { label: 'HTTP+HTTPS', value: 'httphttps' },
      ],
    },
    {
      type: 'select',
      name: 'stg_guiaddress',
      placeholder: 'WebGUI IPv4 Address',
      tooltip: 'Choose a recent IP address to limit the usage when\
 accessing the administrative GUI. The built-in HTTP server binds to the\
 wildcard address of <i>0.0.0.0</i> (any address) and issues an alert if\
 the specified address becomes unavailable.',
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'select',
      name: 'stg_guiv6address',
      placeholder: 'WebGUI IPv6 Address',
      tooltip: 'Choose a recent IPv6 address to limit the usage when\
 accessing the administrative GUI. The built-in HTTP server binds to the\
 wildcard address of <i>0.0.0.0</i> (any address) and issues an alert if\
 the specified address becomes unavailable.',
      options: []
    },
    {
      type: 'input',
      name: 'stg_guiport',
      placeholder: 'WebGUI HTTP Port',
      tooltip: 'Allow configuring a non-standard port to access the GUI\
 over <i>HTTP</i>. Changing this setting may require changing a\
 <a href="https://www.redbrick.dcu.ie/~d_fens/articles/Firefox:_This_Address_is_Restricted"\
 target="_blank">Firefox configuration setting</a>.',
      inputType: 'number',
      validation: [Validators.required]
    },
    {
      type: 'input',
      name: 'stg_guihttpsport',
      placeholder: 'WebGUI HTTPS Port',
      tooltip: 'Allow configuring a non-standard port to access the GUI\
 over <i>HTTPS</i>.',
      inputType: 'number',
      validation: [Validators.required]
    },
    {
      type: 'select',
      name: 'stg_guicertificate',
      placeholder: 'GUI SSL Certificate',
      tooltip: 'Required for <i>HTTPS</i>. Browse to the location of the\
 certificate to use for encrypted connections. If there are no\
 certificates, create a\
 <a href="http://doc.freenas.org/11/system.html#cas"\
 target="_blank">Certificate Authority (CA)</a> then the\
 <a href="http://doc.freenas.org/11/system.html#certificates"\
 target="_blank">Certificate</a>.',
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'checkbox',
      name: 'stg_guihttpsredirect',
      placeholder: 'WebGUI HTTP -> HTTPS Redirect',
      tooltip: 'Check this to redirect <i>HTTP</i> connections to\
 <i>HTTPS</i>. <i>HTTPS</i> must be selected in <b>Protocol</b>.'
    },
    {
      type: 'select',
      name: 'stg_language',
      placeholder: 'Language (Require UI reload)',
      tooltip: 'Select a localization and reload the browser.\
 Localization progress is viewable on\
 <a href="https://weblate.trueos.org/projects/freenas/#languages"\
 target="_blank">Weblate</a>.',
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'select',
      name: 'stg_kbdmap',
      placeholder: 'Console Keyboard Map',
      tooltip: 'Select a keyboard layout.',
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'select',
      name: 'stg_timezone',
      placeholder: 'Timezone',
      tooltip: 'Select a time zone.',
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'select',
      name: 'stg_sysloglevel',
      placeholder: 'Syslog level',
      tooltip: 'When <b>Syslog server</b> is defined, only logs matching\
 this level are sent.',
      options: []
    },
    {
      type: 'input',
      name: 'stg_syslogserver',
      placeholder: 'Syslog server',
      tooltip: 'Define an\
 <i>IP address_or_hostname:optional_port_number</i> to send logs. When\
 set, log entries write to both the console and remote server.',
    }
  ];

  private stg_guiaddress: any;
  private stg_guiv6address: any;
  private stg_guicertificate: any;
  private stg_language: any;
  private stg_kbdmap: any;
  private stg_timezone: any;
  private stg_sysloglevel: any;
  private stg_syslogserver: any;

  constructor(protected rest: RestService, protected router: Router) {}

  afterInit(entityEdit: any) {
    entityEdit.ws.call('certificate.query', [
        [
          ['cert_CSR', '=', null]
        ]
      ])
      .subscribe((res) => {
        this.stg_guicertificate =
          _.find(this.fieldConfig, { 'name': 'stg_guicertificate' });
        res.forEach((item) => {
          this.stg_guicertificate.options.push({ label: item.cert_name, value: item.id });
        });
      });

    entityEdit.ws.call('notifier.choices', ['IPChoices', [true, false]])
      .subscribe((res) => {
        this.stg_guiaddress =
          _.find(this.fieldConfig, { 'name': 'stg_guiaddress' });
        this.stg_guiaddress.options.push({ label: '0.0.0.0', value: '0.0.0.0' });
        res.forEach((item) => {
          this.stg_guiaddress.options.push({ label: item[1], value: item[0] });
        });
      });

    entityEdit.ws.call('notifier.choices', ['IPChoices', [false, true]])
      .subscribe((res) => {
        this.stg_guiv6address =
          _.find(this.fieldConfig, { 'name': 'stg_guiv6address' });
        this.stg_guiv6address.options.push({ label: '::', value: '::' });
        res.forEach((item) => {
          this.stg_guiv6address.options.push({ label: item[1], value: item[0] });
        });
      });

    entityEdit.ws.call('notifier.gui_languages').subscribe((res) => {
      this.stg_language = _.find(this.fieldConfig, { 'name': 'stg_language' });
      res.forEach((item) => {
        this.stg_language.options.push({ label: item[1], value: item[0] });
      });
    });

    entityEdit.ws.call('notifier.choices', ['KBDMAP_CHOICES'])
      .subscribe((res) => {
        this.stg_kbdmap = _.find(this.fieldConfig, { 'name': 'stg_kbdmap' });
        res.forEach((item) => {
          this.stg_kbdmap.options.push({ label: item[1], value: item[0] });
        });
      });

    entityEdit.ws.call('notifier.choices', ['TimeZoneChoices'])
      .subscribe((res) => {
        this.stg_timezone =
          _.find(this.fieldConfig, { 'name': 'stg_timezone' });
        res.forEach((item) => {
          this.stg_timezone.options.push({ label: item[1], value: item[0] });
        });
      });

    entityEdit.ws.call('notifier.choices', ['SYS_LOG_LEVEL'])
      .subscribe((res) => {
        this.stg_sysloglevel =
          _.find(this.fieldConfig, { 'name': 'stg_sysloglevel' });
        res.forEach((item) => {
          this.stg_sysloglevel.options.push({ label: item[1], value: item[0] });
        });
      });
  }

  gotoSaveConfig() {
    this.router.navigate(
      new Array('').concat(['system', 'general', 'config-save']));
  }

  gotoUploadConfig() {
    this.router.navigate(
      new Array('').concat(['system', 'general', 'config-upload']));
  }

  gotoResetConfig() {
    this.router.navigate(
      new Array('').concat(['system', 'general', 'config-reset']));
  }
}
