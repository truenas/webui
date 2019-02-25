import { ApplicationRef, Component, Injector, OnInit, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import { T } from '../../../translate-marker';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { RestService, UserService, WebSocketService, LanguageService, DialogService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { RequestOptions, Http } from '@angular/http';

@Component({
  selector: 'app-general',
  template: `<entity-form [conf]="this"></entity-form>`,
  styleUrls: ['./general.component.css'],
})
export class GeneralComponent implements OnDestroy {

  protected resource_name: string = 'system/settings';

  public fieldConfig: FieldConfig[] = [
    {
      type: 'select',
      name: 'stg_guiprotocol',
      placeholder: T('Protocol'),
      tooltip: T('Define the web protocol to use when connecting to the\
                  administrative GUI from a browser. To change the\
                  default <i>HTTP</i> to <i>HTTPS</i> or\
                  <i>HTTP+HTTPS</i>, a <b>Certificate</b> must also be\
                  chosen.'),
      options: [
        { label: 'HTTP', value: 'http' },
        { label: 'HTTPS', value: 'https' },
        { label: 'HTTP+HTTPS', value: 'httphttps' },
      ],
    },
    {
      type: 'select',
      name: 'stg_guicertificate',
      placeholder: T('GUI SSL Certificate'),
      tooltip: T('Required for <i>HTTPS</i>. Browse to the location of\
                  the certificate to use for encrypted connections. If\
                  there are no certificates, create a <a\
                  href="%%docurl%%/system.html%%webversion%%#cas"\
                  target="_blank">Certificate Authority (CA)</a> then\
                  the <a href="%%docurl%%/system.html%%webversion%%#certificates"\
                  target="_blank">Certificate</a>.'),
      options: [
        { label: '---', value: null }
      ],
      required: true,
      validation: [Validators.required],
      relation : [
        {
          action : 'DISABLE',
          when : [ {
            name : 'stg_guiprotocol',
            value : 'http',
          } ]
        },
      ],
    },
    {
      type: 'select',
      name: 'stg_guiaddress',
      placeholder: T('WebGUI IPv4 Address'),
      tooltip: T('Choose a recent IP address to limit the usage when\
                  accessing the administrative GUI. The built-in HTTP\
                  server binds to the wildcard address of <i>0.0.0.0</i>\
                  (any address) and issues an alert if the specified\
                  address becomes unavailable.'),
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'select',
      name: 'stg_guiv6address',
      placeholder: T('WebGUI IPv6 Address'),
      tooltip: T('Choose a recent IPv6 address to limit the usage when\
                  accessing the administrative GUI. The built-in HTTP\
                  server binds to the wildcard address of <i>0.0.0.0</i>\
                  (any address) and issues an alert if the specified\
                  address becomes unavailable.'),
      options: []
    },
    {
      type: 'input',
      name: 'stg_guiport',
      placeholder: T('WebGUI HTTP Port'),
      tooltip: T('Allow configuring a non-standard port to access the GUI\
                  over <i>HTTP</i>. Changing this setting might require\
                  changing a <a\
                  href="https://www.redbrick.dcu.ie/~d_fens/articles/Firefox:_This_Address_is_Restricted"\
                  target="_blank">Firefox configuration setting</a>.'),
      inputType: 'number',
      validation: [Validators.required]
    },
    {
      type: 'input',
      name: 'stg_guihttpsport',
      placeholder: T('WebGUI HTTPS Port'),
      tooltip: T('Allow configuring a non-standard port to access the GUI\
                  over <i>HTTPS</i>.'),
      inputType: 'number',
      validation: [Validators.required]
    },
    {
      type: 'checkbox',
      name: 'stg_guihttpsredirect',
      placeholder: T('WebGUI HTTP -> HTTPS Redirect'),
      tooltip: T('Check this to redirect <i>HTTP</i> connections to\
                  <i>HTTPS</i>. <i>HTTPS</i> must be selected in\
                  <b>Protocol</b>.'),
    },
    {
      type: 'select',
      name: 'stg_language',
      placeholder: T('Language'),
      tooltip: T('Select a language localization.'),
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'select',
      name: 'stg_kbdmap',
      placeholder: T('Console Keyboard Map'),
      tooltip: T('Select a keyboard layout.'),
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'select',
      name: 'stg_timezone',
      placeholder: T('Timezone'),
      tooltip: T('Select a time zone.'),
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'select',
      name: 'stg_sysloglevel',
      placeholder: T('Syslog level'),
      tooltip: T('When Syslog server is defined, only logs matching this\
                  level are sent.'),
      options: []
    },
    {
      type: 'input',
      name: 'stg_syslogserver',
      placeholder: T('Syslog server'),
      tooltip: T('Define an <i>IP address or hostname:optional_port_number</i>\
                  to send logs. When set, log entries write to both the\
                  console and remote server.'),
    }
  ];
  protected saveConfigFieldConf: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'secretseed',
      placeholder: T('Export Password Secret Seed')
    }
  ];
  public saveConfigFormConf: DialogFormConfiguration = {
    title: "Save Configuration",
    message: T('<b>WARNING:</b> This configuration file contains system\
              passwords and other sensitive data.<br>'),
    fieldConfig: this.saveConfigFieldConf,
    method_ws: 'core.download',
    saveButtonText: T('Save'),
    customSubmit: this.saveConfigSubmit,
    warning: T('<p>Including the Password Secret Seed allows using this\
              configuration file with a new boot device. This also\
              decrypts all system passwords for reuse when the\
              configuration file is uploaded.</p>\
              <b>Keep the configuration file safe and protect it\
              from unauthorized access!</b>'),
  }

  protected uploadConfigFieldConf: FieldConfig[] = [
    {
      type: 'upload',
      name: 'upload_config',
      placeholder : T('Select Configuration File'),
      tooltip: 'Browse to the locally saved configuration file.',
      fileLocation: '',
      updater: this.updater,
      parent: this,
      hideButton: true,
    }
  ];
  public uploadConfigFormConf: DialogFormConfiguration = {
    title: "Upload Config",
    fieldConfig: this.uploadConfigFieldConf,
    method_ws: 'config.upload',
    saveButtonText: T('Upload'),
    customSubmit: this.uploadConfigSubmit,
    message: T('<p>The system will reboot to perform this operation!</p>\
              <p><font color="red">All passwords are reset when the \
              uploaded configuration database file was saved \
              without the Password Secret Seed. </font></p>'),
  }
  public custActions: Array<any> = [
  {
    id : 'save_config',
    name : T('Save Config'),
    function : () => {
      this.dialog.dialogForm(this.saveConfigFormConf);
    }
  },{
    id : 'upload_config',
    name: T('Upload Config'),
    function : () => {
      this.dialog.dialogForm(this.uploadConfigFormConf);
    }
  },{
    id : 'reset_config',
    name: T('Reset Config'),
    function: () => {this.router.navigate(new Array('').concat(['system', 'general', 'config-reset']))}
  }];
  private stg_guiprotocol: any;
  private stg_guiprotocol_subscription: any;
  private stg_guiaddress: any;
  private stg_guiv6address: any;
  private stg_guicertificate: any;
  private stg_guihttpsredirect: any;
  private stg_language: any;
  private stg_kbdmap: any;
  private stg_timezone: any;
  private stg_sysloglevel: any;
  private stg_syslogserver: any;

  private protocol: any;
  private http_port: any;
  private https_port: any;
  private redirect: any;
  private guicertificate: any;
  //private hostname: '(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])';
  private entityForm: any;

  constructor(protected rest: RestService, protected router: Router,
    protected language: LanguageService, protected ws: WebSocketService,
    protected dialog: DialogService, protected loader: AppLoaderService,
    public http: Http) {}

  resourceTransformIncomingRestData(value) {
    this.protocol = value['stg_guiprotocol'];
    this.http_port = value['stg_guiport'];
    this.https_port = value['stg_guihttpsport'];
    this.redirect = value['stg_guihttpsredirect'];
    this.guicertificate = value['stg_guicertificate'];
    return value;
  }

  reconnect(href) {
    if (this.entityForm.ws.connected) {
      this.loader.close();
      // ws is connected
      window.location.replace(href);
    } else {
      setTimeout(() => {
        this.reconnect(href);
      }, 5000);
    }
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.stg_guicertificate =
    _.find(this.fieldConfig, { 'name': 'stg_guicertificate' });
    entityEdit.ws.call('certificate.query', [
        [
          ['CSR', '=', null]
        ]
      ])
      .subscribe((res) => {
        res.forEach((item) => {
          this.stg_guicertificate.options.push({ label: item.name, value: item.id });
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

      this.stg_guiprotocol = entityEdit.formGroup.controls['stg_guiprotocol'];
      if (this.stg_guiprotocol.value === 'http') {
        this.stg_guicertificate.isHidden = true;
      }
      this.stg_guihttpsredirect = _.find(this.fieldConfig,{'name' : 'stg_guihttpsredirect'});
      this.stg_guiprotocol_subscription = this.stg_guiprotocol.valueChanges.subscribe((value) => {
        if (value === 'http') {
          this.stg_guicertificate.isHidden = true;
          this.stg_guihttpsredirect.isHidden = true;
        } else if (value ==='httphttps') {
          this.stg_guihttpsredirect.isHidden = true;
          this.stg_guicertificate.isHidden = false;
        } else {
          this.stg_guihttpsredirect.isHidden = false;
          this.stg_guicertificate.isHidden = false;
        }
      });
  }

  ngOnDestroy () {
    this.stg_guiprotocol_subscription.unsubscribe();
  }

  afterSubmit(value) {
    let newprotocol = value.stg_guiprotocol;
    let new_http_port = value.stg_guiport;
    let new_https_port = value.stg_guihttpsport;
    let new_redirect = value.stg_guihttpsredirect;
    let new_guicertificate = value.stg_guicertificate;
    if (this.protocol !== newprotocol ||
        this.http_port !== new_http_port ||
        this.https_port !== new_https_port ||
        this.redirect !== new_redirect ||
        this.guicertificate !== new_guicertificate) {
      this.dialog.confirm(T("Restart Web Service"), T("The web service must restart \
                             for the protocol changes to take effect. The UI will be \
                             temporarily unavailable. Restart the service?"))
        .subscribe((res)=> {
          if (res) {
            let href = window.location.href;
            let hostname = window.location.hostname;
            let port = window.location.port;
            let protocol;
            if (newprotocol === 'httphttps') {
              protocol = 'http:'
            } else {
              protocol = newprotocol + ':';
            }

            if (new_http_port !== this.http_port && protocol == 'http:') {
              port = new_http_port;
            } else if (new_https_port !== this.https_port && protocol == 'https:') {
              port = new_https_port;
            }

            href = protocol + '//' + hostname + ':' + port + window.location.pathname;

            this.loader.open();
            this.entityForm.ws.shuttingdown = true; // not really shutting down, just stop websocket detection temporarily
            this.entityForm.ws.call("service.restart", ["http"]).subscribe((res)=> {
            }, (res) => {
              this.loader.close();
              this.dialog.errorReport(T("Error restarting web service"), res.reason, res.trace.formatted);
            });

            this.entityForm.ws.reconnect(protocol, hostname + ':' + port);
            setTimeout(() => {
              this.reconnect(href);
            }, 1000);
          }
        });
    }
    this.language.setLang(value.stg_language);
  }

  saveConfigSubmit(entityDialog) {
    entityDialog.ws.call('system.info', []).subscribe((res) => {
      let fileName = "";
      if (res) {
        let hostname = res.hostname.split('.')[0];
        let date = entityDialog.datePipe.transform(new Date(),"yyyyMMddHHmmss");
        fileName = hostname + '-' + res.version + '-' + date;
        if (entityDialog.formValue['secretseed']) {
          fileName += '.tar';
        } else {
          fileName += '.db';
        }
      }

      entityDialog.ws.call('core.download', ['config.save', [{ 'secretseed': entityDialog.formValue['secretseed'] }], fileName])
        .subscribe(
          (res) => {
            entityDialog.snackBar.open(T("Download Sucessful"), T("Success") , {
              duration: 5000
            });
            if (window.navigator.userAgent.search("Firefox")>0) {
              window.open(res[1]);
          }
            else {
              window.location.href = res[1];
            }
            entityDialog.dialogRef.close();
          },
          (err) => {
            entityDialog.snackBar.open("Check the network connection", "Failed" , {
              duration: 5000
            });
          }
        );
    });
  }

  updater(file: any, parent: any){
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      parent.subs = {"apiEndPoint":file.apiEndPoint, "file": fileBrowser.files[0]}
    }
  }

  uploadConfigSubmit(entityDialog) {
    const parent = entityDialog.conf.fieldConfig[0].parent;
    const formData: FormData = new FormData();

    parent.loader.open();
    formData.append('data', JSON.stringify({
      "method": "config.upload",
      "params": []
    }));
    formData.append('file', parent.subs.file);

    parent.http.post(parent.subs.apiEndPoint, formData).subscribe(
      (data) => {
        parent.loader.close();
        entityDialog.dialogRef.close();
        parent.router.navigate(['/others/reboot']);
      },
      (err) => {
        parent.loader.close();
        this.dialog.errorReport(err.status, err.statusText, err._body);
      }
    );
  }
}
