import { Component } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { Validators, ValidationErrors, FormControl } from '@angular/forms';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material';
import { DialogService, LanguageService, RestService, WebSocketService, StorageService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { EntityUtils } from '../../common/entity/utils';
import { T } from '../../../translate-marker';


@Component({
  selector: 'app-general',
  template: `<entity-form [conf]="this"></entity-form>`,
  styleUrls: ['./general.component.css'],
  providers: []
})
export class GeneralComponent {

  //protected resource_name: string = 'system/settings';
  protected queryCall = 'system.general.config';
  protected updateCall = 'system.general.update';
  public sortLanguagesByName = true;
  public languageList: any;

  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: 'top',
      width: '100%',
      label: false,
      config:[
      {
        type: 'select',
        name: 'ui_certificate',
        placeholder: helptext.stg_guicertificate.placeholder,
        tooltip: helptext.stg_guicertificate.tooltip,
        options: [
          { label: '---', value: null }
        ],
        required: true,
        validation: helptext.stg_guicertificate.validation,
      },
      {
        type: 'select',
        name: 'ui_address',
        multiple: true,
        placeholder: helptext.stg_guiaddress.placeholder,
        tooltip: helptext.stg_guiaddress.tooltip,
        required: true,
        options: [],
        validation: [this.IPValidator('ui_address', '0.0.0.0')]
      },
      {
        type: 'select',
        name: 'ui_v6address',
        multiple: true,
        placeholder: helptext.stg_guiv6address.placeholder,
        tooltip: helptext.stg_guiv6address.tooltip,
        required: true,
        options: [],
        validation: [this.IPValidator('ui_v6address', '::')]
      },
      {
        type: 'input',
        name: 'ui_port',
        placeholder: helptext.stg_guiport.placeholder,
        tooltip: helptext.stg_guiport.tooltip,
        inputType: 'number',
        validation: helptext.stg_guiport.validation
      },
      {
        type: 'input',
        name: 'ui_httpsport',
        placeholder: helptext.stg_guihttpsport.placeholder,
        tooltip: helptext.stg_guihttpsport.tooltip,
        inputType: 'number',
        validation: helptext.stg_guihttpsport.validation
      },
      {
        type: 'checkbox',
        name: 'ui_httpsredirect',
        placeholder: helptext.stg_guihttpsredirect.placeholder,
        tooltip: helptext.stg_guihttpsredirect.tooltip,
      }
    ]
  },
  {
    name: 'col1',
    width: '49%',
    label: false,
    config:[
      {
        type: 'select',
        name: 'language',
        placeholder: helptext.stg_language.placeholder,
        tooltip: helptext.stg_language.tooltip,
        options: []
      }
    ]
  },
  {
    name: 'spacer',
    width: '2%',
    label: false,
    config:[]
  },
  {
    name: 'col2',
    width: '49%',
    label: false,
    config:[
    {
      type: 'radio',
      name: 'language_sort',
      placeholder: helptext.stg_language_sort_label,
      options: [
        {label: helptext.stg_language_sort_name,
         name: 'language_name',
         value: true},
        {label: helptext.stg_language_sort_code,
         name: 'language_code',
         value: false},
      ],
      value: true
    },
  ]},
  {
    name: 'bottom',
    width: '100%',
    label: false,
    config:[
      {
        type: 'select',
        name: 'kbdmap',
        placeholder: helptext.stg_kbdmap.placeholder,
        tooltip: helptext.stg_kbdmap.tooltip,
        options: [
          { label: '---', value: null }
        ]
      },
      {
        type: 'select',
        name: 'timezone',
        placeholder: helptext.stg_timezone.placeholder,
        tooltip: helptext.stg_timezone.tooltip,
        options: [
          { label: '---', value: null }
        ]
      },
      {
        type: 'select',
        name: 'sysloglevel',
        placeholder: helptext.stg_sysloglevel.placeholder,
        tooltip: helptext.stg_sysloglevel.tooltip,
        options: []
      },
      {
        type: 'input',
        name: 'syslogserver',
        placeholder: helptext.stg_syslogserver.placeholder,
        tooltip: helptext.stg_syslogserver.tooltip,
      },
      {
        type: 'checkbox',
        name: 'crash_reporting',
        placeholder: helptext.crash_reporting.placeholder,
        tooltip: helptext.crash_reporting.tooltip
      },
      {
        type: 'checkbox',
        name: 'usage_collection',
        placeholder: helptext.usage_collection.placeholder,
        tooltip: helptext.usage_collection.tooltip
      }
    ]
  }];

  protected saveConfigFieldConf: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'secretseed',
      placeholder: helptext.secretseed.placeholder,
      tooltip: helptext.secretseed.tooltip
    },
    {
      type: 'checkbox',
      name: 'pool_keys',
      placeholder: helptext.poolkeys.placeholder,
      tooltip: helptext.poolkeys.tooltip
    }
  ];
  public saveConfigFormConf: DialogFormConfiguration = {
    title: helptext.save_config_form.title,
    message: helptext.save_config_form.message,
    fieldConfig: this.saveConfigFieldConf,
    method_ws: 'core.download',
    saveButtonText: helptext.save_config_form.button_text,
    customSubmit: this.saveConfigSubmit,
    parent: this,
    warning: helptext.save_config_form.warning,
  }

  protected uploadConfigFieldConf: FieldConfig[] = [
    {
      type: 'upload',
      name: 'upload_config',
      placeholder : helptext.upload_config.placeholder,
      tooltip: helptext.upload_config_form.tooltip,
      fileLocation: '',
      updater: this.updater,
      parent: this,
      hideButton: true,
    }
  ];
  public uploadConfigFormConf: DialogFormConfiguration = {
    title: helptext.upload_config_form.title,
    fieldConfig: this.uploadConfigFieldConf,
    method_ws: 'config.upload',
    saveButtonText: helptext.upload_config_form.button_text,
    customSubmit: this.uploadConfigSubmit,
    message: helptext.upload_config_form.message,
  }

  protected resetConfigFieldConf: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'reboot_option',
      placeholder: helptext.reset_config_placeholder,
      required: true
    }
  ]

  public resetConfigFormConf: DialogFormConfiguration = {
    title: helptext.reset_config_form.title,
    message: helptext.reset_config_form.message,
    fieldConfig: this.resetConfigFieldConf,
    method_ws: 'config.reset',
    saveButtonText: helptext.reset_config_form.button_text,
    customSubmit: this.resetConfigSubmit,
    parent: this
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
    function: () => {
      this.dialog.dialogForm(this.resetConfigFormConf);
    }
  }];

  private ui_address: any;
  private ui_v6address: any;
  private ui_certificate: any;
  private language_fc: any;
  private kbdmap: any;
  private timezone: any;
  private sysloglevel: any;

  private addresses: any;
  private v6addresses: any;
  private http_port: any;
  private https_port: any;
  private redirect: any;
  private guicertificate: any;
  private entityForm: any;
  private dialogRef: any;

  constructor(protected rest: RestService, protected router: Router,
    protected language: LanguageService, protected ws: WebSocketService,
    protected dialog: DialogService, protected loader: AppLoaderService,
    public http: Http, protected storage: StorageService,  private mdDialog: MatDialog) {}

  IPValidator(name: string, wildcard: string) {
    const self = this;
    return function validIPs(control: FormControl) {
      const config = self.fieldConfig.find(c => c.name === name);
      
      const errors = control.value && control.value.length > 1 && _.indexOf(control.value, wildcard) !== -1
        ? { validIPs : true }
        : null;
    
        if (errors) {
          config.hasErrors = true;
          config.errors = helptext.validation_errors[name];
        } else {
          config.hasErrors = false;
          config.errors = '';
        }

        return errors;
    }
  }

  resourceTransformIncomingRestData(value) {
    this.http_port = value['ui_port'];
    this.https_port = value['ui_httpsport'];
    this.redirect = value['ui_httpsredirect'];
    if (value['ui_certificate'] && value['ui_certificate'].id) {
      value['ui_certificate'] = value['ui_certificate'].id.toString();
      this.guicertificate = value['ui_certificate'];
    }
    this.addresses = value['ui_address'];
    this.v6addresses = value['ui_v6address'];
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
    this.ui_certificate =
    _.find(this.fieldConfig, { 'name': 'ui_certificate' });
    entityEdit.ws.call('system.general.ui_certificate_choices')
      .subscribe((res) => {
        for (const id in res) {
          this.ui_certificate.options.push({ label: res[id], value: id });
        }
      });

    entityEdit.ws.call('notifier.choices', ['IPChoices', [true, false]])
      .subscribe((res) => {
        this.ui_address =
          _.find(this.fieldConfig, { 'name': 'ui_address' });
        this.ui_address.options.push({ label: '0.0.0.0', value: '0.0.0.0' });
        res.forEach((item) => {
          this.ui_address.options.push({ label: item[1], value: item[0] });
        });
      });

    entityEdit.ws.call('notifier.choices', ['IPChoices', [false, true]])
      .subscribe((res) => {
        this.ui_v6address =
          _.find(this.fieldConfig, { 'name': 'ui_v6address' });
        let wildcard_found = false;
        res.forEach((item) => {
          if (item[0] === '::' && !wildcard_found) {
            wildcard_found = true;
          }
          this.ui_v6address.options.push({ label: item[1], value: item[0] });
        });
        if (!wildcard_found) {
          this.ui_v6address.options.unshift({ label: '::', value: '::' });
        }
      });

    entityEdit.ws.call('notifier.gui_languages').subscribe((res) => {
      this.languageList = res;
      this.makeLanguageList();
    });

    entityEdit.ws.call('notifier.choices', ['KBDMAP_CHOICES'])
      .subscribe((res) => {
        this.kbdmap = _.find(this.fieldConfig, { 'name': 'kbdmap' });
        res.forEach((item) => {
          this.kbdmap.options.push({ label: item[1], value: item[0] });
        });
      });

    entityEdit.ws.call('notifier.choices', ['TimeZoneChoices'])
      .subscribe((res) => {
        this.timezone =
          _.find(this.fieldConfig, { 'name': 'timezone' });
        res.forEach((item) => {
          this.timezone.options.push({ label: item[1], value: item[0] });
        });
      });

    entityEdit.ws.call('notifier.choices', ['SYS_LOG_LEVEL'])
      .subscribe((res) => {
        this.sysloglevel =
          _.find(this.fieldConfig, { 'name': 'sysloglevel' });
        res.forEach((item) => {
          this.sysloglevel.options.push({ label: item[1], value: item[0] });
        });
      });

      entityEdit.formGroup.controls['language_sort'].valueChanges.subscribe((res)=> {
        res ? this.sortLanguagesByName = true : this.sortLanguagesByName = false;
        this.makeLanguageList();
      })
  }
  
  makeLanguageList() {
    let sort;
    this.sortLanguagesByName ? sort = 'label' : sort = 'value';
    this.language_fc = _.find(this.fieldConfig, { 'name': 'language' });
    const options = [];
    this.languageList.forEach((item) => {
      if (sort === 'label') {
        options.push({ label: item[1] + ' (' + item[0] + ')', value: item[0] });
      } else {
        options.push({ label: item[0] + ' (' + item[1] + ')', value: item[0] });
      }
    });
    this.language_fc.options = _.sortBy(options, [sort]);
  }
   
  beforeSubmit(value) {
    delete value.language_sort;
  }

  afterSubmit(value) {
    const new_http_port = value.ui_port;
    const new_https_port = value.ui_httpsport;
    const new_redirect = value.ui_httpsredirect;
    const new_guicertificate = value.ui_certificate;
    const new_addresses = value.ui_address;
    const new_v6addresses = value.ui_v6address;
    if (this.http_port !== new_http_port ||
        this.https_port !== new_https_port ||
        this.redirect !== new_redirect ||
        this.guicertificate !== new_guicertificate ||
        !(this.addresses.length === new_addresses.length &&
           this.addresses.every((val, index) => val === new_addresses[index])) ||
        !(this.v6addresses.length === new_v6addresses.length &&
           this.v6addresses.every((val, index) => val === new_v6addresses[index]))) {
      this.dialog.confirm(helptext.dialog_confirm_title, helptext.dialog_confirm_title)
        .subscribe((res)=> {
          if (res) {
            let href = window.location.href;
            let hostname = window.location.hostname;
            let port = window.location.port;
            let protocol = window.location.protocol;

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
    this.language.setLang(value.language);
  }

  saveConfigSubmit(entityDialog) {
    parent = entityDialog.parent;
    entityDialog.loader.open();
    entityDialog.ws.call('system.info', []).subscribe((res) => {
      let fileName = "";
      let mimetype;
      if (res) {
        let hostname = res.hostname.split('.')[0];
        let date = entityDialog.datePipe.transform(new Date(),"yyyyMMddHHmmss");
        fileName = hostname + '-' + res.version + '-' + date;
        if (entityDialog.formValue['secretseed'] || entityDialog.formValue['pool_keys']) {
          mimetype = 'application/x-tar';
          fileName += '.tar';
        } else {
          mimetype = 'application/x-sqlite3';
          fileName += '.db';
        }
      }

      entityDialog.ws.call('core.download', ['config.save', [{ 'secretseed': entityDialog.formValue['secretseed'],
                                                               'pool_keys': entityDialog.formValue['pool_keys'] }],
                                                               fileName])
        .subscribe(
          (download) => {
            const url = download[1];
            entityDialog.parent.storage.streamDownloadFile(entityDialog.parent.http, url, fileName, mimetype).subscribe(file => {
              entityDialog.loader.close();
              entityDialog.dialogRef.close();
              entityDialog.parent.storage.downloadBlob(file, fileName);
            }, err => {
              entityDialog.loader.close();
              entityDialog.dialogRef.close();
              entityDialog.dialog.errorReport(helptext.config_download.failed_title, helptext.config_download.failed_message, err);
            });
          },
          (err) => {
            entityDialog.loader.close();
            entityDialog.dialogRef.close();
            new EntityUtils().handleWSError(entityDialog, err, entityDialog.dialog);
          }
        );
    },
    (err) => {
      entityDialog.loader.close();
      entityDialog.dialogRef.close();
      new EntityUtils().handleWSError(entityDialog, err, entityDialog.dialog);
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

  resetConfigSubmit(entityDialog) {
    const parent = entityDialog.parent;
    parent.router.navigate(new Array('').concat(['others', 'config-reset']))
  }

  public customSubmit(body) {
    this.loader.open();
    return this.ws.call('system.general.update', [body]).subscribe(() => {
      this.loader.close();
      this.dialog.Info(T("Settings saved."), '', '300px', 'info', true);
      this.afterSubmit(body);
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

  getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }
}
