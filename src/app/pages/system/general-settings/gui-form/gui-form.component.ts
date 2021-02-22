import { Component, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DialogService, LanguageService, StorageService, 
  SystemGeneralService, WebSocketService } from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { ModalService } from '../../../../services/modal.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-gui-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: []
})
export class GuiFormComponent implements OnDestroy{
  protected queryCall = 'none';
  protected updateCall = 'system.general.update';
  public sortLanguagesByName = true;
  public languageList: { label: string; value: string }[] = [];
  public languageKey: string;  
  private getDataFromDash: Subscription;
  public fieldConfig: FieldConfig[] = []

  public fieldSets: FieldSet[] = [
    {
      name: helptext.stg_fieldset_gui,
      width: "100%",
      label: true,
      config: [
        {
          type: "select",
          name: "ui_certificate",
          placeholder: helptext.stg_guicertificate.placeholder,
          tooltip: helptext.stg_guicertificate.tooltip,
          options: [{ label: "---", value: null }],
          required: true,
          validation: helptext.stg_guicertificate.validation
        },
        {
          type: "select",
          name: "ui_address",
          multiple: true,
          placeholder: helptext.stg_guiaddress.placeholder,
          tooltip: helptext.stg_guiaddress.tooltip,
          required: true,
          options: [],
          validation: [this.IPValidator("ui_address", "0.0.0.0")]
        },
        {
          type: "select",
          name: "ui_v6address",
          multiple: true,
          placeholder: helptext.stg_guiv6address.placeholder,
          tooltip: helptext.stg_guiv6address.tooltip,
          required: true,
          options: [],
          validation: [this.IPValidator("ui_v6address", "::")]
        },
        {
          type: "input",
          name: "ui_port",
          placeholder: helptext.stg_guiport.placeholder,
          tooltip: helptext.stg_guiport.tooltip,
          inputType: "number",
          validation: helptext.stg_guiport.validation
        },
        {
          type: "input",
          name: "ui_httpsport",
          placeholder: helptext.stg_guihttpsport.placeholder,
          tooltip: helptext.stg_guihttpsport.tooltip,
          inputType: "number",
          validation: helptext.stg_guihttpsport.validation
        },
        {
          type: "select",
          multiple: true,
          name: "ui_httpsprotocols",
          placeholder: helptext.stg_guihttpsprotocols.placeholder,
          tooltip: helptext.stg_guihttpsprotocols.tooltip,
          options: [],
        },
        {
          type: "checkbox",
          name: "ui_httpsredirect",
          placeholder: helptext.stg_guihttpsredirect.placeholder,
          tooltip: helptext.stg_guihttpsredirect.tooltip
        }
      ]
    },
    {
      name: helptext.stg_fieldset_other,
      label: true,
      config: [
        {
          type: "checkbox",
          name: "crash_reporting",
          placeholder: helptext.crash_reporting.placeholder,
          tooltip: helptext.crash_reporting.tooltip
        },
        {
          type: "checkbox",
          name: "usage_collection",
          placeholder: helptext.usage_collection.placeholder,
          tooltip: helptext.usage_collection.tooltip
        },
      ]
    },
  ];

  private ui_certificate: any;
  private addresses: any;
  private v6addresses: any;
  private http_port: any;
  private https_port: any;
  private redirect: any;
  private guicertificate: any;
  private entityForm: any;
  private configData: any;
  protected title = helptext.guiPageTitle;

  constructor(
    protected router: Router,
    protected language: LanguageService,
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected loader: AppLoaderService,
    public http: HttpClient,
    protected storage: StorageService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService
  ) {
    this.getDataFromDash = this.sysGeneralService.sendConfigData$.subscribe(res => {
      this.configData = res;
    })
  }

  IPValidator(name: string, wildcard: string) {
    const self = this;
    return function validIPs(control: FormControl) {
      const config =
        self.fieldSets.find(set => set.name === helptext.stg_fieldset_gui).config.find(c => c.name === name);
      
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

  preInit() {
    this.http_port = this.configData['ui_port'];
    this.https_port = this.configData['ui_httpsport'];
    this.redirect = this.configData['ui_httpsredirect'];
    if (this.configData['ui_certificate'] && this.configData['ui_certificate'].id) {
      this.configData['ui_certificate'] = this.configData['ui_certificate'].id.toString();
      this.guicertificate = this.configData['ui_certificate'];
    }
    this.addresses = this.configData['ui_address'];
    this.v6addresses = this.configData['ui_v6address'];
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
      .find(set => set.name === helptext.stg_fieldset_gui)
      .config.find(config => config.name === "ui_certificate");

    entityEdit.ws.call('system.general.ui_certificate_choices')
      .subscribe((res) => {
        this.ui_certificate.options = [{ label: "---", value: null }];
        for (const id in res) {
          this.ui_certificate.options.push({ label: res[id], value: id });
        }
        entityEdit.formGroup.controls['ui_certificate'].setValue(this.configData.ui_certificate);
      });

    const httpsprotocolsField = this.fieldSets
      .find(set => set.name === helptext.stg_fieldset_gui)
      .config.find(config => config.name === "ui_httpsprotocols");

    entityEdit.ws.call('system.general.ui_httpsprotocols_choices').subscribe(
      (res) => {
        httpsprotocolsField.options = [];
        for (const key in res) {
          httpsprotocolsField.options.push({ label: res[key], value: key });
        }
        entityEdit.formGroup.controls['ui_httpsprotocols'].setValue(this.configData.ui_httpsprotocols);
    });

    this.sysGeneralService
      .ipChoicesv4()
      .subscribe(ips => {
        this.fieldSets
          .find(set => set.name === helptext.stg_fieldset_gui)
          .config.find(config => config.name === "ui_address").options = ips;
          entityEdit.formGroup.controls['ui_address'].setValue(this.configData.ui_address);
      });

    this.sysGeneralService
      .ipChoicesv6()
      .subscribe(v6Ips => {
        this.fieldSets
          .find(set => set.name === helptext.stg_fieldset_gui)
          .config.find(config => config.name === "ui_v6address").options = v6Ips;
            entityEdit.formGroup.controls['ui_v6address'].setValue(this.configData.ui_v6address);
      });

    entityEdit.formGroup.controls['ui_port'].setValue(this.configData.ui_port);
    entityEdit.formGroup.controls['ui_httpsport'].setValue(this.configData.ui_httpsport);
    entityEdit.formGroup.controls['ui_httpsredirect'].setValue(this.configData.ui_httpsredirect);
    entityEdit.formGroup.controls['crash_reporting'].setValue(this.configData.crash_reporting);
    entityEdit.formGroup.controls['usage_collection'].setValue(this.configData.usage_collection);

  }

  beforeSubmit(value) {
    delete value.language_sort;
    value.language = this.languageKey;
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

   public customSubmit(body) {
    this.loader.open();
    return this.ws.call('system.general.update', [body]).subscribe(() => {
      this.loader.close();
      this.modalService.close('slide-in-form');
      this.sysGeneralService.refreshSysGeneral();
      this.entityForm.success = true;
      this.entityForm.formGroup.markAsPristine();
      this.afterSubmit(body);
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

  getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }

  ngOnDestroy() {
    this.getDataFromDash.unsubscribe();
  }

}
