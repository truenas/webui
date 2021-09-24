import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Type } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CoreService } from 'app/core/services/core-service/core.service';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { CoreEvent } from 'app/interfaces/events';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/pages//common/entity/entity-job/entity-job.component';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FormUploadComponent } from 'app/pages/common/entity/entity-form/components/form-upload/form-upload.component';
import { FieldConfig, FormUploadConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-servers/ntp-server-form/ntp-server-form.component';
import { DataCard } from 'app/pages/system/interfaces/data-card.interface';
import {
  WebSocketService, SystemGeneralService, DialogService, StorageService,
}
  from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { LocaleService } from 'app/services/locale.service';
import { ModalService } from 'app/services/modal.service';
import { GuiFormComponent } from './gui-form/gui-form.component';
import { LocalizationFormComponent } from './localization-form/localization-form.component';

@UntilDestroy()
@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
})
export class GeneralSettingsComponent implements OnInit {
  dataCards: DataCard[] = [];
  supportTitle = helptext.supportTitle;
  ntpTitle = helptext.ntpTitle;
  localeData: DataCard;
  configData: SystemGeneralConfig;
  displayedColumns: string[];
  subs: any;
  dataSource: NtpServer[];
  formEvent$: Subject<CoreEvent>;

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
    customSubmit: () => this.resetConfigSubmit(),
    parent: this,
  };

  constructor(
    private ws: WebSocketService,
    private localeService: LocaleService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private router: Router,
    public mdDialog: MatDialog,
    private core: CoreService,
    private storage: StorageService,
    private http: HttpClient,
  ) { }

  ngOnInit(): void {
    this.getDataCardData();
    this.sysGeneralService.refreshSysGeneral$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getDataCardData();
    });
    this.getNTPData();
    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getNTPData();
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
          id: 'gui',
          items: [
            { label: helptext.stg_guicertificate.placeholder, value: res.ui_certificate.name },
            { label: helptext.stg_guiaddress.placeholder, value: res.ui_address.join(', ') },
            { label: helptext.stg_guiv6address.placeholder, value: res.ui_v6address.join(', ') },
            { label: helptext.stg_guihttpsport.placeholder, value: res.ui_httpsport },
            { label: helptext.stg_guihttpsprotocols.placeholder, value: res.ui_httpsprotocols.join(', ') },
            { label: helptext.stg_guihttpsredirect.placeholder, value: res.ui_httpsredirect as any },
            {
              label: helptext.crash_reporting.placeholder,
              value: res.crash_reporting ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext.usage_collection.placeholder,
              value: res.usage_collection ? helptext.enabled : helptext.disabled,
            },
            { label: helptext.consolemsg_placeholder, value: res.ui_consolemsg ? helptext.enabled : helptext.disabled },
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
          this.localeData = {
            title: helptext.localeTitle,
            id: 'localization',
            items: [
              { label: helptext.stg_language.placeholder, value: languages[res.language] },
              { label: helptext.date_format.placeholder, value: this.localeService.getDateAndTime(res.timezone)[0] },
              { label: helptext.time_format.placeholder, value: this.localeService.getDateAndTime(res.timezone)[1] },
              { label: helptext.stg_timezone.placeholder, value: res.timezone },
              { label: helptext.stg_kbdmap.placeholder, value: res.kbdmap ? keyboardMap.label : helptext.default },
            ],
          };
          this.dataCards.push(this.localeData);
        });
      });
    });
  }

  doAdd(name: string, id?: number): void {
    let addComponent: Type<GuiFormComponent | NtpServerFormComponent | LocalizationFormComponent>;
    switch (name) {
      case 'gui':
        addComponent = GuiFormComponent;
        break;
      case 'ntp':
        addComponent = NtpServerFormComponent;
        break;
      default:
        addComponent = LocalizationFormComponent;
    }
    this.sysGeneralService.sendConfigData(this.configData);
    this.modalService.openInSlideIn(addComponent, id);
  }

  doNTPDelete(server: NtpServer): void {
    this.dialog.confirm({
      title: helptext.deleteServer.title,
      message: `${helptext.deleteServer.message} ${server.address}?`,
      buttonMsg: helptext.deleteServer.message,
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.loader.open();
      this.ws.call('system.ntpserver.delete', [server.id]).pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.getNTPData();
      }, (err) => {
        this.loader.close();
        this.dialog.errorReport('Error', err.reason, err.trace.formatted);
      });
    });
  }

  getNTPData(): void {
    this.ws.call('system.ntpserver.query').pipe(untilDestroyed(this)).subscribe((res) => {
      this.dataSource = res;
      this.displayedColumns = ['address', 'burst', 'iburst', 'prefer', 'minpoll', 'maxpoll', 'actions'];
    });
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

  updater(file: FormUploadComponent, parent: this): void {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      parent.subs = { apiEndPoint: file.apiEndPoint, file: fileBrowser.files[0] };
    }
  }

  uploadConfigSubmit(entityDialog: EntityDialogComponent<GeneralSettingsComponent>): void {
    const config = entityDialog.conf.fieldConfig[0] as FormUploadConfig;
    const parent: GeneralSettingsComponent = config.parent;
    const formData: FormData = new FormData();

    const dialogRef = parent.mdDialog.open(EntityJobComponent,
      { data: { title: helptext.config_upload.title, closeOnClickOutside: false } });
    dialogRef.componentInstance.setDescription(helptext.config_upload.message);
    formData.append('data', JSON.stringify({
      method: 'config.upload',
      params: [],
    }));
    formData.append('file', parent.subs.file);
    dialogRef.componentInstance.wspost(parent.subs.apiEndPoint, formData);
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      parent.router.navigate(['/others/reboot']);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      dialogRef.componentInstance.setDescription(res.error);
    });
  }

  resetConfigSubmit(): void {
    this.router.navigate(new Array('').concat(['others', 'config-reset']));
  }
}
