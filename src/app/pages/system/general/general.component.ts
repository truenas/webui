import { Component, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { EntityJobComponent } from 'app/pages//common/entity/entity-job/entity-job.component';
import {
  DialogService, LanguageService, RestService, StorageService, SystemGeneralService, WebSocketService,
} from '../../../services';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { LocaleService } from 'app/services/locale.service';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import globalHelptext from '../../../helptext/global-helptext';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'app-general',
  template: '<entity-form [conf]="this"></entity-form>',
  styleUrls: ['./general.component.css'],
  providers: [],
})
export class GeneralComponent implements OnDestroy {
  protected queryCall = 'system.general.config';
  protected updateCall = 'system.general.update';
  sortLanguagesByName = true;
  languageList: { label: string; value: string }[] = [];
  languageKey: string;
  private dateTimeChangeSubscription: Subscription;
  fieldConfig: FieldConfig[] = [];

  fieldSets: FieldSet[] = [
    {
      name: helptext.stg_fieldset_gui,
      width: '100%',
      label: true,
      config: [
        {
          type: 'select',
          name: 'ui_certificate',
          placeholder: helptext.stg_guicertificate.placeholder,
          tooltip: helptext.stg_guicertificate.tooltip,
          options: [{ label: '---', value: null }],
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
          validation: [this.IPValidator('ui_address', '0.0.0.0')],
        },
        {
          type: 'select',
          name: 'ui_v6address',
          multiple: true,
          placeholder: helptext.stg_guiv6address.placeholder,
          tooltip: helptext.stg_guiv6address.tooltip,
          required: true,
          options: [],
          validation: [this.IPValidator('ui_v6address', '::')],
        },
        {
          type: 'input',
          name: 'ui_port',
          placeholder: helptext.stg_guiport.placeholder,
          tooltip: helptext.stg_guiport.tooltip,
          inputType: 'number',
          validation: helptext.stg_guiport.validation,
        },
        {
          type: 'input',
          name: 'ui_httpsport',
          placeholder: helptext.stg_guihttpsport.placeholder,
          tooltip: helptext.stg_guihttpsport.tooltip,
          inputType: 'number',
          validation: helptext.stg_guihttpsport.validation,
        },
        {
          type: 'select',
          multiple: true,
          name: 'ui_httpsprotocols',
          placeholder: helptext.stg_guihttpsprotocols.placeholder,
          tooltip: helptext.stg_guihttpsprotocols.tooltip,
          options: [],
        },
        {
          type: 'checkbox',
          name: 'ui_httpsredirect',
          placeholder: helptext.stg_guihttpsredirect.placeholder,
          tooltip: helptext.stg_guihttpsredirect.tooltip,
        },
      ],
    },
    { name: 'divider', divider: true },
    {
      name: helptext.stg_fieldset_loc,
      label: true,
      config: [
        {
          type: 'combobox',
          name: 'language',
          label: helptext.stg_language.label,
          placeholder: helptext.stg_language.placeholder,
          tooltip: helptext.stg_language.tooltip,
          options: [],
          width: '50%',
        },
        {
          type: 'select',
          name: 'kbdmap',
          placeholder: helptext.stg_kbdmap.placeholder,
          tooltip: helptext.stg_kbdmap.tooltip,
          options: [{ label: '---', value: null }],
          width: '50%',
        },
        {
          type: 'radio',
          name: 'language_sort',
          placeholder: helptext.stg_language_sort_label,
          options: [
            {
              label: helptext.stg_language_sort_name,
              name: 'language_name',
              value: true,
            },
            {
              label: helptext.stg_language_sort_code,
              name: 'language_code',
              value: false,
            },
          ],
          value: true,
          width: '50%',
        },
        {
          type: 'combobox',
          name: 'timezone',
          label: helptext.stg_timezone.label,
          placeholder: helptext.stg_timezone.placeholder,
          tooltip: helptext.stg_timezone.tooltip,
          options: [{ label: '---', value: null }],
          width: '50%',
        },
        {
          type: 'select',
          name: 'date_format',
          placeholder: helptext.date_format.placeholder,
          tooltip: helptext.date_format.tooltip,
          options: [],
          width: '48%',
          isLoading: true,
        },
        { type: 'paragraph', name: 'spacer', width: '2%' },
        {
          type: 'select',
          name: 'time_format',
          placeholder: helptext.time_format.placeholder,
          tooltip: helptext.time_format.tooltip,
          options: [],
          width: '50%',
          isLoading: true,
        },
      ],
    },
    { name: 'divider', divider: true },
    {
      name: helptext.stg_fieldset_other,
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'crash_reporting',
          placeholder: helptext.crash_reporting.placeholder,
          tooltip: helptext.crash_reporting.tooltip,
        },
        {
          type: 'checkbox',
          name: 'usage_collection',
          placeholder: helptext.usage_collection.placeholder,
          tooltip: helptext.usage_collection.tooltip,
        },
      ],
    },
    { name: 'divider', divider: true },
  ];

  protected saveConfigFieldConf: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'secretseed',
      placeholder: helptext.secretseed.placeholder,
      tooltip: helptext.secretseed.tooltip,
    },
    {
      type: 'checkbox',
      name: 'pool_keys',
      placeholder: helptext.poolkeys.placeholder,
      tooltip: helptext.poolkeys.tooltip,
    },
    {
      type: 'input',
      name: 'rootpw',
      inputType: 'password',
      required: true,
      togglePw: true,
      placeholder: globalHelptext.rootpw.placeholder,
      tooltip: globalHelptext.rootpw.tooltip,
    },
  ];
  saveConfigFormConf: DialogFormConfiguration = {
    title: helptext.save_config_form.title,
    message: helptext.save_config_form.message,
    fieldConfig: this.saveConfigFieldConf,
    method_ws: 'core.download',
    saveButtonText: helptext.save_config_form.button_text,
    customSubmit: this.saveConfigSubmit,
    parent: this,
    warning: helptext.save_config_form.warning,
  };

  protected uploadConfigFieldConf: FieldConfig[] = [
    {
      type: 'upload',
      name: 'upload_config',
      placeholder: helptext.upload_config.placeholder,
      tooltip: helptext.upload_config_form.tooltip,
      validation: helptext.upload_config_form.validation,
      fileLocation: '',
      updater: this.updater,
      parent: this,
      hideButton: true,
    },
  ];
  uploadConfigFormConf: DialogFormConfiguration = {
    title: helptext.upload_config_form.title,
    fieldConfig: this.uploadConfigFieldConf,
    method_ws: 'config.upload',
    saveButtonText: helptext.upload_config_form.button_text,
    customSubmit: this.uploadConfigSubmit,
    message: helptext.upload_config_form.message,
  };

  protected resetConfigFieldConf: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'reboot_option',
      placeholder: helptext.reset_config_placeholder,
      required: true,
    },
  ];

  resetConfigFormConf: DialogFormConfiguration = {
    title: helptext.reset_config_form.title,
    message: helptext.reset_config_form.message,
    fieldConfig: this.resetConfigFieldConf,
    method_ws: 'config.reset',
    saveButtonText: helptext.reset_config_form.button_text,
    customSubmit: this.resetConfigSubmit,
    parent: this,
  };

  custActions: any[] = [
    {
      id: 'save_config',
      name: helptext.actions.save_config,
      function: () => {
        this.dialog.dialogForm(this.saveConfigFormConf);
      },
    }, {
      id: 'upload_config',
      name: helptext.actions.upload_config,
      function: () => {
        this.dialog.dialogForm(this.uploadConfigFormConf);
      },
    }, {
      id: 'reset_config',
      name: helptext.actions.reset_config,
      function: () => {
        this.dialog.dialogForm(this.resetConfigFormConf);
      },
    }];

  private ui_certificate: any;

  private addresses: any;
  private v6addresses: any;
  private http_port: any;
  private https_port: any;
  private redirect: any;
  private guicertificate: any;
  private entityForm: any;

  constructor(
    protected rest: RestService,
    protected router: Router,
    protected language: LanguageService,
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected loader: AppLoaderService,
    public http: HttpClient,
    protected storage: StorageService,
    private sysGeneralService: SystemGeneralService,
    public localeService: LocaleService,
    public mdDialog: MatDialog,
  ) {}

  IPValidator(name: string, wildcard: string) {
    const self = this;
    return function validIPs(control: FormControl) {
      const config = self.fieldSets.find((set) => set.name === helptext.stg_fieldset_gui).config.find((c) => c.name === name);

      const errors = control.value && control.value.length > 1 && _.indexOf(control.value, wildcard) !== -1
        ? { validIPs: true }
        : null;

      if (errors) {
        config.hasErrors = true;
        config.errors = helptext.validation_errors[name];
      } else {
        config.hasErrors = false;
        config.errors = '';
      }

      return errors;
    };
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
    this.setTimeOptions(value.timezone);
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

    this.ui_certificate = this.fieldSets
      .find((set) => set.name === helptext.stg_fieldset_gui)
      .config.find((config) => config.name === 'ui_certificate');

    entityEdit.ws.call('system.general.ui_certificate_choices')
      .subscribe((res) => {
        for (const id in res) {
          this.ui_certificate.options.push({ label: res[id], value: id });
        }
      });

    const httpsprotocolsField = this.fieldSets
      .find((set) => set.name === helptext.stg_fieldset_gui)
      .config.find((config) => config.name === 'ui_httpsprotocols');

    entityEdit.ws.call('system.general.ui_httpsprotocols_choices').subscribe(
      (res) => {
        for (const key in res) {
          httpsprotocolsField.options.push({ label: res[key], value: key });
        }
      },
    );

    this.sysGeneralService
      .ipChoicesv4()
      .subscribe((ips) => {
        this.fieldSets
          .find((set) => set.name === helptext.stg_fieldset_gui)
          .config.find((config) => config.name === 'ui_address').options = ips;
      });

    this.sysGeneralService
      .ipChoicesv6()
      .subscribe((v6Ips) => {
        this.fieldSets
          .find((set) => set.name === helptext.stg_fieldset_gui)
          .config.find((config) => config.name === 'ui_v6address').options = v6Ips;
      });

    this.makeLanguageList();

    this.sysGeneralService.kbdMapChoices().subscribe((mapChoices) => {
      this.fieldSets
        .find((set) => set.name === helptext.stg_fieldset_loc)
        .config.find((config) => config.name === 'kbdmap').options = mapChoices;
    });

    this.sysGeneralService.timezoneChoices().subscribe((tzChoices) => {
      tzChoices = _.sortBy(tzChoices, [function (o) { return o.label.toLowerCase(); }]);
      this.fieldSets
        .find((set) => set.name === helptext.stg_fieldset_loc)
        .config.find((config) => config.name === 'timezone').options = tzChoices;
    });

    entityEdit.formGroup.controls['language_sort'].valueChanges.subscribe((res) => {
      res ? this.sortLanguagesByName = true : this.sortLanguagesByName = false;
      this.makeLanguageList();
    });

    this.getDateTimeFormats();
    this.dateTimeChangeSubscription = this.localeService.dateTimeFormatChange$.subscribe(() => {
      this.getDateTimeFormats();
    });

    entityEdit.formGroup.controls['language'].valueChanges.subscribe((res) => {
      this.languageKey = this.getKeyByValue(this.languageList, res);
      if (this.languageList[res]) {
        entityEdit.formGroup.controls['language'].setValue(`${this.languageList[res]}`);
      }
    });

    entityEdit.ws.call('pool.query', [[['encrypt', '>=', 1]]]).subscribe((legacyEncryptedPools: any[]) => {
      if (!legacyEncryptedPools.length) {
        _.find(this.saveConfigFieldConf, { name: 'pool_keys' }).disabled = true;
      }
    });
  }

  setTimeOptions(tz: string) {
    const timeOptions = this.localeService.getTimeFormatOptions(tz);
    this.fieldSets
      .find((set) => set.name === helptext.stg_fieldset_loc)
      .config.find((config) => config.name === 'time_format').options = timeOptions;

    const dateOptions = this.localeService.getDateFormatOptions(tz);
    this.fieldSets
      .find((set) => set.name === helptext.stg_fieldset_loc)
      .config.find((config) => config.name === 'date_format').options = dateOptions;
  }

  getDateTimeFormats() {
    this.entityForm.formGroup.controls['date_format'].setValue(this.localeService.getPreferredDateFormat());
    _.find(this.fieldConfig, { name: 'date_format' })['isLoading'] = false;
    this.entityForm.formGroup.controls['time_format'].setValue(this.localeService.getPreferredTimeFormat());
    _.find(this.fieldConfig, { name: 'time_format' })['isLoading'] = false;
  }

  makeLanguageList() {
    this.sysGeneralService.languageChoices().subscribe((res) => {
      this.languageList = res;
      const options = Object.keys(this.languageList || {}).map((key) => ({
        label: this.sortLanguagesByName
          ? `${this.languageList[key]} (${key})`
          : `${key} (${this.languageList[key]})`,
        value: key,
      }));
      this.fieldSets
        .find((set) => set.name === helptext.stg_fieldset_loc)
        .config.find((config) => config.name === 'language').options = _.sortBy(
          options,
          this.sortLanguagesByName ? 'label' : 'value',
        );
    });
  }

  beforeSubmit(value) {
    delete value.language_sort;
    value.language = this.languageKey;
  }

  afterSubmit(value) {
    this.setTimeOptions(value.timezone);
    const new_http_port = value.ui_port;
    const new_https_port = value.ui_httpsport;
    const new_redirect = value.ui_httpsredirect;
    const new_guicertificate = value.ui_certificate;
    const new_addresses = value.ui_address;
    const new_v6addresses = value.ui_v6address;
    if (this.http_port !== new_http_port
        || this.https_port !== new_https_port
        || this.redirect !== new_redirect
        || this.guicertificate !== new_guicertificate
        || !(this.addresses.length === new_addresses.length
           && this.addresses.every((val, index) => val === new_addresses[index]))
        || !(this.v6addresses.length === new_v6addresses.length
           && this.v6addresses.every((val, index) => val === new_v6addresses[index]))) {
      this.dialog.confirm(helptext.dialog_confirm_title, helptext.dialog_confirm_title)
        .subscribe((res) => {
          if (res) {
            let href = window.location.href;
            const hostname = window.location.hostname;
            let port = window.location.port;
            const protocol = window.location.protocol;

            if (new_http_port !== this.http_port && protocol == 'http:') {
              port = new_http_port;
            } else if (new_https_port !== this.https_port && protocol == 'https:') {
              port = new_https_port;
            }

            href = protocol + '//' + hostname + ':' + port + window.location.pathname;

            this.loader.open();
            this.entityForm.ws.shuttingdown = true; // not really shutting down, just stop websocket detection temporarily
            this.entityForm.ws.call('service.restart', ['http']).subscribe((res) => {
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
    this.language.setLanguage(value.language);
  }

  saveConfigSubmit(entityDialog) {
    const parent = entityDialog.parent;
    entityDialog.loader.open();
    parent.sysGeneralService.checkRootPW(entityDialog.formValue['rootpw']).subscribe((passres) => {
      if (passres) {
        entityDialog.ws.call('system.info', []).subscribe((res) => {
          let fileName = '';
          let mimetype;
          if (res) {
            const hostname = res.hostname.split('.')[0];
            const date = entityDialog.datePipe.transform(new Date(), 'yyyyMMddHHmmss');
            fileName = hostname + '-' + res.version + '-' + date;
            if (entityDialog.formValue['secretseed'] || entityDialog.formValue['pool_keys']) {
              mimetype = 'application/x-tar';
              fileName += '.tar';
            } else {
              mimetype = 'application/x-sqlite3';
              fileName += '.db';
            }
          }

          entityDialog.ws.call('core.download', ['config.save', [{
            secretseed: entityDialog.formValue['secretseed'],
            pool_keys: entityDialog.formValue['pool_keys'],
          }],
          fileName])
            .subscribe(
              (download) => {
                const url = download[1];
                entityDialog.parent.storage.streamDownloadFile(entityDialog.parent.http, url, fileName, mimetype).subscribe((file) => {
                  entityDialog.loader.close();
                  entityDialog.dialogRef.close();
                  entityDialog.parent.storage.downloadBlob(file, fileName);
                }, (err) => {
                  entityDialog.loader.close();
                  entityDialog.dialogRef.close();
                  entityDialog.parent.dialog.errorReport(helptext.config_download.failed_title,
                    helptext.config_download.failed_message, err.message);
                });
              },
              (err) => {
                entityDialog.loader.close();
                entityDialog.dialogRef.close();
                new EntityUtils().handleWSError(entityDialog, err, entityDialog.dialog);
              },
            );
        },
        (err) => {
          entityDialog.loader.close();
          entityDialog.dialogRef.close();
          new EntityUtils().handleWSError(entityDialog, err, entityDialog.dialog);
        });
      } else {
        entityDialog.loader.close();
        parent.dialog.report(globalHelptext.rootpw.error_title, globalHelptext.rootpw.error_msg, '340px');
      }
    },
    (err) => {
      entityDialog.loader.close();
      entityDialog.dialogRef.close();
      new EntityUtils().handleWSError(entityDialog, err, entityDialog.dialog);
    });
  }

  updater(file: any, parent: any) {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      parent.subs = { apiEndPoint: file.apiEndPoint, file: fileBrowser.files[0] };
    }
  }

  uploadConfigSubmit(entityDialog) {
    const parent = entityDialog.conf.fieldConfig[0].parent;
    const formData: FormData = new FormData();

    const dialogRef = parent.mdDialog.open(EntityJobComponent,
      { data: { title: helptext.config_upload.title, CloseOnClickOutside: false } });
    dialogRef.componentInstance.setDescription(helptext.config_upload.message);
    formData.append('data', JSON.stringify({
      method: 'config.upload',
      params: [],
    }));
    formData.append('file', parent.subs.file);
    dialogRef.componentInstance.wspost(parent.subs.apiEndPoint, formData);
    dialogRef.componentInstance.success.subscribe((res) => {
      dialogRef.close();
      parent.router.navigate(['/others/reboot'], { skipLocationChange: true });
    });
    dialogRef.componentInstance.failure.subscribe((res) => {
      dialogRef.componentInstance.setDescription(res.error);
    });
  }

  resetConfigSubmit(entityDialog) {
    const parent = entityDialog.parent;
    parent.router.navigate(['others', 'config-reset'], { skipLocationChange: true });
  }

  customSubmit(body) {
    this.localeService.saveDateTimeFormat(body.date_format, body.time_format);
    delete body.date_format;
    delete body.time_format;
    this.loader.open();
    return this.ws.call('system.general.update', [body]).subscribe(() => {
      this.loader.close();
      this.entityForm.success = true;
      this.entityForm.formGroup.markAsPristine();
      this.afterSubmit(body);
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

  getKeyByValue(object, value) {
    return Object.keys(object).find((key) => object[key] === value);
  }

  ngOnDestroy() {
    this.dateTimeChangeSubscription.unsubscribe();
  }
}
