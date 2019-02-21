import { Component, OnDestroy } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { DialogService, LanguageService, RestService, WebSocketService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { helptext_system_general as helptext } from 'app/helptext/system/general';

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
      placeholder: helptext.stg_guiprotocol.placeholder,
      tooltip: helptext.stg_guiprotocol.tooltip,
      options: [
        { label: 'HTTP', value: 'http' },
        { label: 'HTTPS', value: 'https' },
        { label: 'HTTP+HTTPS', value: 'httphttps' },
      ],
    },
    {
      type: 'select',
      name: 'stg_guicertificate',
      placeholder: helptext.stg_guicertificate.placeholder,
      tooltip: helptext.stg_guicertificate.tooltip,
      options: [
        { label: '---', value: null }
      ],
      required: true,
      validation: helptext.stg_guicertificate.validation,
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
      placeholder: helptext.stg_guiaddress.placeholder,
      tooltip: helptext.stg_guiaddress.tooltip,
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'select',
      name: 'stg_guiv6address',
      placeholder: helptext.stg_guiv6address.placeholder,
      tooltip: helptext.stg_guiv6address.tooltip,
      options: []
    },
    {
      type: 'input',
      name: 'stg_guiport',
      placeholder: helptext.stg_guiport.placeholder,
      tooltip: helptext.stg_guiport.tooltip,
      inputType: 'number',
      validation: helptext.stg_guiport.validation
    },
    {
      type: 'input',
      name: 'stg_guihttpsport',
      placeholder: helptext.stg_guihttpsport.placeholder,
      tooltip: helptext.stg_guihttpsport.tooltip,
      inputType: 'number',
      validation: helptext.stg_guihttpsport.validation
    },
    {
      type: 'checkbox',
      name: 'stg_guihttpsredirect',
      placeholder: helptext.stg_guihttpsredirect.placeholder,
      tooltip: helptext.stg_guihttpsredirect.tooltip,
    },
    {
      type: 'select',
      name: 'stg_language',
      placeholder: helptext.stg_language.placeholder,
      tooltip: helptext.stg_language.tooltip,
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'select',
      name: 'stg_kbdmap',
      placeholder: helptext.stg_kbdmap.placeholder,
      tooltip: helptext.stg_kbdmap.tooltip,
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'select',
      name: 'stg_timezone',
      placeholder: helptext.stg_timezone.placeholder,
      tooltip: helptext.stg_timezone.tooltip,
      options: [
        { label: '---', value: null }
      ]
    },
    {
      type: 'select',
      name: 'stg_sysloglevel',
      placeholder: helptext.stg_sysloglevel.placeholder,
      tooltip: helptext.stg_sysloglevel.tooltip,
      options: []
    },
    {
      type: 'input',
      name: 'stg_syslogserver',
      placeholder: helptext.stg_syslogserver.placeholder,
      tooltip: helptext.stg_syslogserver.tooltip,
    }
  ];
  protected saveConfigFieldConf: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'secretseed',
      placeholder: helptext.secretseed.placeholder
    }
  ];
  public saveConfigFormConf: DialogFormConfiguration = {
    title: "Save Configuration",
    message: helptext.save_config_form.message,
    fieldConfig: this.saveConfigFieldConf,
    method_ws: 'core.download',
    saveButtonText: helptext.save_config_form.button_text,
    customSubmit: this.saveConfigSubmit,
    warning: helptext.save_config_form.warning,
  }

  protected uploadConfigFieldConf: FieldConfig[] = [
    {
      type: 'upload',
      name: 'upload_config',
      placeholder : helptext.upload_config.placeholder,
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
    saveButtonText: helptext.upload_config_form.button_text,
    customSubmit: this.uploadConfigSubmit,
    message: helptext.upload_config_form.message,
  }
  public custActions: Array<any> = [
  {
    id : 'save_config',
    name : helptext.actions.save_config,
    function : () => {
      this.dialog.dialogForm(this.saveConfigFormConf);
    }
  },{
    id : 'upload_config',
    name: helptext.actions.upload_config,
    function : () => {
      this.dialog.dialogForm(this.uploadConfigFormConf);
    }
  },{
    id : 'reset_config',
    name: helptext.actions.reset_config,
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
    this.redirect = value['stg_guihttpsredirect']
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
        this.stg_guicertificate['isHidden'] = true;
      }
      this.stg_guihttpsredirect = _.find(this.fieldConfig,{'name' : 'stg_guihttpsredirect'});
      this.stg_guiprotocol_subscription = this.stg_guiprotocol.valueChanges.subscribe((value) => {
        if (value === 'http') {
          this.stg_guicertificate['isHidden'] = true;
          this.stg_guihttpsredirect['isHidden'] = true;
        } else if (value ==='httphttps') {
          this.stg_guihttpsredirect['isHidden'] = true;
          this.stg_guicertificate['isHidden'] = false;
        } else {
          this.stg_guihttpsredirect['isHidden'] = false;
          this.stg_guicertificate['isHidden'] = false;
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
    if (this.protocol !== newprotocol ||
        this.http_port !== new_http_port ||
        this.https_port !== new_https_port ||
        this.redirect !== new_redirect) {
      this.dialog.confirm(helptext.dialog_confirm_title, helptext.dialog_confirm_title)
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
              this.dialog.errorReport(helptext.dialog_error_title, res.reason, res.trace.formatted);
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
            entityDialog.snackBar.open(helptext.snackbar_download_success.title, helptext.snackbar_download_success.action, {
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
