import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { CoreService } from 'app/core/services/core-service/core.service';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { helptextSystemNtpservers as helptext_ntp } from 'app/helptext/system/ntp-servers';
import { CoreEvent } from 'app/interfaces/events';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { Subs } from 'app/interfaces/subs.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/pages//common/entity/entity-job/entity-job.component';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FormUploadComponent } from 'app/pages/common/entity/entity-form/components/form-upload/form-upload.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization-form/localization-form.component';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server-form/ntp-server-form.component';
import { DataCard } from 'app/pages/system/interfaces/data-card.interface';
import { SystemGeneralService, DialogService, StorageService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';
import { LocaleService } from 'app/services/locale.service';
import { GuiFormComponent } from './gui-form/gui-form.component';

enum GeneralCardId {
  Gui = 'gui',
  Localization = 'localization',
  Ntp = 'ntp',
}

@UntilDestroy()
@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
})
export class GeneralSettingsComponent implements OnInit {
  dataCards: DataCard<GeneralCardId>[] = [];
  supportTitle = helptext.supportTitle;
  localeData: DataCard<GeneralCardId.Localization>;
  ntpServersData: DataCard<GeneralCardId.Ntp>;
  configData: SystemGeneralConfig;
  subs: Subs;
  formEvent$: Subject<CoreEvent>;
  localizationSettings: LocalizationSettings;

  // Dialog forms and info for saving, uploading, resetting config
  protected saveConfigFieldConf: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'secretseed',
      placeholder: helptext.secretseed.placeholder,
      tooltip: helptext.secretseed.tooltip,
    },
  ];

  saveConfigFormConf: DialogFormConfiguration = {
    title: helptext.save_config_form.title,
    message: helptext.save_config_form.message,
    fieldConfig: this.saveConfigFieldConf,
    method_ws: 'core.download',
    saveButtonText: helptext.save_config_form.button_text,
    customSubmit: (entityDialog) => this.saveConfigSubmit(entityDialog),
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
      updater: (file: FormUploadComponent) => this.updater(file),
      parent: this,
      hideButton: true,
    },
  ];

  uploadConfigFormConf: DialogFormConfiguration = {
    title: helptext.upload_config_form.title,
    fieldConfig: this.uploadConfigFieldConf,
    method_ws: 'config.upload',
    saveButtonText: helptext.upload_config_form.button_text,
    customSubmit: () => this.uploadConfigSubmit(),
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
    customSubmit: () => this.resetConfigSubmit(),
    parent: this,
  };

  constructor(
    private localeService: LocaleService,
    private sysGeneralService: SystemGeneralService,
    private dialog: DialogService,
    private router: Router,
    public mdDialog: MatDialog,
    private core: CoreService,
    private ixModalService: IxModalService,
    private storage: StorageService,
    private http: HttpClient,
  ) { }

  ngOnInit(): void {
    this.getDataCardData();
    this.sysGeneralService.refreshSysGeneral$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getDataCardData();
    });

    this.ixModalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.ntpServersData?.tableConf?.tableComponent.getData();
    });

    this.formEvent$ = new Subject();
    this.formEvent$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      switch (evt.data.configFiles.value) {
        case 'save_config':
          this.dialog.dialogForm(this.saveConfigFormConf);
          break;

        case 'upload_config':
          this.dialog.dialogForm(this.uploadConfigFormConf);
          break;

        case 'reset_config':
          this.dialog.dialogForm(this.resetConfigFormConf);
          break;
      }
    });

    const actionsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.formEvent$,
        controls: [
          {
            name: 'configFiles',
            label: helptext.actions.config_button,
            type: 'menu',
            color: 'primary',
            options: [
              { label: helptext.actions.save_config, value: 'save_config' },
              { label: helptext.actions.upload_config, value: 'upload_config' },
              { label: helptext.actions.reset_config, value: 'reset_config' },
            ],
          },
        ],
      },
    };

    this.core.emit({ name: 'GlobalActions', data: actionsConfig, sender: this });
  }

  getDataCardData(): void {
    this.sysGeneralService.getGeneralConfig$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.configData = res;
      this.dataCards = [
        {
          title: helptext.guiTitle,
          id: GeneralCardId.Gui,
          items: [
            { label: helptext.ui_certificate.label, value: res.ui_certificate.name },
            { label: helptext.ui_address.label, value: res.ui_address.join(', ') },
            { label: helptext.ui_v6address.label, value: res.ui_v6address.join(', ') },
            { label: helptext.ui_port.label, value: res.ui_port },
            { label: helptext.ui_httpsport.label, value: res.ui_httpsport },
            { label: helptext.ui_httpsprotocols.label, value: res.ui_httpsprotocols.join(', ') },
            {
              label: helptext.ui_httpsredirect.label,
              value: res.ui_httpsredirect ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext.crash_reporting.label,
              value: res.crash_reporting ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext.usage_collection.label,
              value: res.usage_collection ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext.ui_consolemsg.label,
              value: res.ui_consolemsg ? helptext.enabled : helptext.disabled,
            },
          ],
          actions: [
            { label: helptext.actions.save_config, value: 'saveConfig', icon: 'save_alt' },
            { label: helptext.actions.upload_config, value: 'upLoadConfig', icon: 'arrow_upward' },
            { label: helptext.actions.reset_config, value: 'resetConfig', icon: 'replay' },
          ],
        },
      ];

      this.sysGeneralService.languageChoices().pipe(untilDestroyed(this)).subscribe((languages) => {
        this.sysGeneralService.kbdMapChoices().pipe(untilDestroyed(this)).subscribe((mapchoices) => {
          const keyboardMap = mapchoices.find((x) => x.value === this.configData.kbdmap);
          const dateTime = this.localeService.getDateAndTime(res.timezone);
          this.localeData = {
            title: helptext.localeTitle,
            id: GeneralCardId.Localization,
            items: [
              { label: helptext.stg_language.placeholder, value: languages[res.language] },
              { label: helptext.date_format.placeholder, value: dateTime[0] },
              { label: helptext.time_format.placeholder, value: dateTime[1] },
              { label: helptext.stg_timezone.placeholder, value: res.timezone },
              { label: helptext.stg_kbdmap.placeholder, value: res.kbdmap ? keyboardMap.label : helptext.default },
            ],
          };
          this.localizationSettings = {
            language: res.language,
            kbdMap: res.kbdmap,
            timezone: res.timezone,
            dateFormat: this.localeService.getPreferredDateFormat(),
            timeFormat: this.localeService.getPreferredTimeFormat(),
          };
          this.dataCards.push(this.localeData);
        });
      });

      this.ntpServersData = {
        id: GeneralCardId.Ntp,
        title: helptext.ntpTitle,
        tableConf: {
          title: helptext.ntpTitle,
          queryCall: 'system.ntpserver.query',
          deleteCall: 'system.ntpserver.delete',
          deleteMsg: {
            title: '',
            key_props: ['address'],
          },
          parent: this,
          columns: [
            { name: helptext_ntp.address.label, prop: 'address' },
            { name: helptext_ntp.burst.label, prop: 'burst', width: '40px' },
            { name: helptext_ntp.iburst.label, prop: 'iburst', width: '40px' },
            { name: helptext_ntp.prefer.label, prop: 'prefer', width: '40px' },
            { name: helptext_ntp.minpoll.label, prop: 'minpoll', width: '60px' },
            { name: helptext_ntp.maxpoll.label, prop: 'maxpoll', width: '60px' },
          ],
          add: () => {
            this.ixModalService.open(NtpServerFormComponent);
          },
          edit: (server: NtpServer) => {
            const modal = this.ixModalService.open(NtpServerFormComponent);
            modal.setupForm(server);
          },
        },
      };
    });
  }

  doAdd(name: GeneralCardId): void {
    switch (name) {
      case GeneralCardId.Gui:
        this.ixModalService.open(GuiFormComponent);
        break;
      default:
        const localizationFormModal = this.ixModalService.open(LocalizationFormComponent);
        localizationFormModal.setupForm(this.localizationSettings);
        break;
    }
    this.sysGeneralService.sendConfigData(this.configData);
  }

  saveConfigSubmit(entityDialog: EntityDialogComponent): void {
    entityDialog.loader.open();
    entityDialog.ws.call('system.info').pipe(untilDestroyed(this)).subscribe((systemInfo) => {
      let fileName = '';
      let mimetype: string;
      if (systemInfo) {
        const hostname = systemInfo.hostname.split('.')[0];
        const date = entityDialog.datePipe.transform(new Date(), 'yyyyMMddHHmmss');
        fileName = hostname + '-' + systemInfo.version + '-' + date;
        if (entityDialog.formValue['secretseed']) {
          mimetype = 'application/x-tar';
          fileName += '.tar';
        } else {
          mimetype = 'application/x-sqlite3';
          fileName += '.db';
        }
      }

      entityDialog.ws.call('core.download', ['config.save', [{ secretseed: entityDialog.formValue['secretseed'] }], fileName])
        .pipe(untilDestroyed(this)).subscribe(
          (download) => {
            const url = download[1];
            this.storage
              .streamDownloadFile(this.http, url, fileName, mimetype)
              .pipe(untilDestroyed(this))
              .subscribe((file: Blob) => {
                entityDialog.loader.close();
                entityDialog.dialogRef.close();
                this.storage.downloadBlob(file, fileName);
              }, (err: Error) => {
                entityDialog.loader.close();
                entityDialog.dialogRef.close();
                this.dialog.errorReport(helptext.config_download.failed_title,
                  helptext.config_download.failed_message, err.message);
              });
          },
          (err: WebsocketError) => {
            entityDialog.loader.close();
            entityDialog.dialogRef.close();
            new EntityUtils().handleWSError(entityDialog, err, this.dialog);
          },
        );
    },
    (err: WebsocketError) => {
      entityDialog.loader.close();
      entityDialog.dialogRef.close();
      new EntityUtils().handleWSError(entityDialog, err, this.dialog);
    });
  }

  updater(file: FormUploadComponent): void {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      this.subs = { apiEndPoint: file.apiEndPoint, file: fileBrowser.files[0] };
    }
  }

  uploadConfigSubmit(): void {
    const formData: FormData = new FormData();

    const dialogRef = this.mdDialog.open(EntityJobComponent,
      { data: { title: helptext.config_upload.title, closeOnClickOutside: false } });
    dialogRef.componentInstance.setDescription(helptext.config_upload.message);
    formData.append('data', JSON.stringify({
      method: 'config.upload',
      params: [],
    }));
    formData.append('file', this.subs.file);
    dialogRef.componentInstance.wspost(this.subs.apiEndPoint, formData);
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      this.router.navigate(['/others/reboot']);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      dialogRef.componentInstance.setDescription(res.error);
    });
  }

  resetConfigSubmit(): void {
    this.router.navigate(new Array('').concat(['others', 'config-reset']));
  }
}
