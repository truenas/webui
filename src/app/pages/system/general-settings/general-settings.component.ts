import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { AdminLayoutComponent } from 'app/components/common/layouts/admin-layout/admin-layout.component';
import { CoreService } from 'app/core/services/core.service';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { CoreEvent } from 'app/interfaces/events';
import { EntityJobComponent } from 'app/pages//common/entity/entity-job/entity-job.component';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  WebSocketService, SystemGeneralService, DialogService, LanguageService, StorageService,
}
  from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { LocaleService } from 'app/services/locale.service';
import { ModalService } from 'app/services/modal.service';
import { GuiFormComponent } from './gui-form/gui-form.component';
import { LocalizationFormComponent } from './localization-form/localization-form.component';
import { NTPServerFormComponent } from './ntpservers/ntpserver-form/ntpserver-form.component';

@UntilDestroy()
@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
})
export class GeneralSettingsComponent implements OnInit {
  dataCards: any[] = [];
  supportTitle = helptext.supportTitle;
  ntpTitle = helptext.ntpTitle;
  localeData: any;
  configData: any;
  displayedColumns: any;
  dataSource: any;
  formEvents: Subject<CoreEvent>;

  // Components included in this dashboard
  protected localizationComponent = new LocalizationFormComponent(this.language, this.ws, this.dialog, this.loader,
    this.sysGeneralService, this.localeService, this.modalService);
  protected guiComponent = new GuiFormComponent(this.router, this.language, this.ws, this.dialog, this.loader,
    this.http, this.storage, this.sysGeneralService, this.modalService, this.adminLayout);
  protected NTPServerFormComponent = new NTPServerFormComponent(this.modalService);

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

  constructor(private ws: WebSocketService, private localeService: LocaleService,
    private sysGeneralService: SystemGeneralService, private modalService: ModalService,
    private language: LanguageService, private dialog: DialogService, private loader: AppLoaderService,
    private router: Router, private http: HttpClient, private storage: StorageService,
    public mdDialog: MatDialog, private core: CoreService, private adminLayout: AdminLayoutComponent) { }

  ngOnInit(): void {
    this.getDataCardData();
    this.sysGeneralService.refreshSysGeneral$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getDataCardData();
    });
    this.getNTPData();
    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getNTPData();
    });

    this.formEvents = new Subject();
    this.formEvents.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
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
        target: this.formEvents,
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
    this.sysGeneralService.getGeneralConfig.pipe(untilDestroyed(this)).subscribe((res) => {
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
            { label: helptext.stg_guihttpsredirect.placeholder, value: res.ui_httpsredirect },
            { label: helptext.crash_reporting.placeholder, value: res.crash_reporting ? helptext.enabled : helptext.disabled },
            { label: helptext.usage_collection.placeholder, value: res.usage_collection ? helptext.enabled : helptext.disabled },
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
    let addComponent;
    switch (name) {
      case 'gui':
        addComponent = this.guiComponent;
        break;
      case 'ntp':
        addComponent = id ? this.NTPServerFormComponent : new NTPServerFormComponent(this.modalService);
        break;
      default:
        addComponent = this.localizationComponent;
    }
    this.sysGeneralService.sendConfigData(this.configData);
    this.modalService.open('slide-in-form', addComponent, id);
  }

  doNTPDelete(server: any): void {
    this.dialog.confirm(helptext.deleteServer.title, `${helptext.deleteServer.message} ${server.address}?`,
      false, helptext.deleteServer.message).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (res) {
        this.loader.open();
        this.ws.call('system.ntpserver.delete', [server.id]).pipe(untilDestroyed(this)).subscribe(() => {
          this.loader.close();
          this.getNTPData();
        }, (err) => {
          this.loader.close();
          this.dialog.errorReport('Error', err.reason, err.trace.formatted);
        });
      }
    });
  }

  getNTPData(): void {
    this.ws.call('system.ntpserver.query').pipe(untilDestroyed(this)).subscribe((res) => {
      this.dataSource = res;
      this.displayedColumns = ['address', 'burst', 'iburst', 'prefer', 'minpoll', 'maxpoll', 'actions'];
    });
  }

  saveConfigSubmit(entityDialog: any): void {
    parent = entityDialog.parent;
    entityDialog.loader.open();
    (entityDialog.ws as WebSocketService).call('system.info', []).pipe(untilDestroyed(this)).subscribe((systemInfo) => {
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
          (download: any) => {
            const url = download[1];
            entityDialog.parent.storage
              .streamDownloadFile(entityDialog.parent.http, url, fileName, mimetype)
              .pipe(untilDestroyed(this))
              .subscribe((file: Blob) => {
                entityDialog.loader.close();
                entityDialog.dialogRef.close();
                entityDialog.parent.storage.downloadBlob(file, fileName);
              }, (err: any) => {
                entityDialog.loader.close();
                entityDialog.dialogRef.close();
                entityDialog.parent.dialog.errorReport(helptext.config_download.failed_title,
                  helptext.config_download.failed_message, err.message);
              });
          },
          (err: any) => {
            entityDialog.loader.close();
            entityDialog.dialogRef.close();
            new EntityUtils().handleWSError(entityDialog, err, entityDialog.dialog);
          },
        );
    },
    (err: any) => {
      entityDialog.loader.close();
      entityDialog.dialogRef.close();
      new EntityUtils().handleWSError(entityDialog, err, entityDialog.dialog);
    });
  }

  updater(file: any, parent: any): void {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      parent.subs = { apiEndPoint: file.apiEndPoint, file: fileBrowser.files[0] };
    }
  }

  uploadConfigSubmit(entityDialog: EntityDialogComponent): void {
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
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      parent.router.navigate(['/others/reboot']);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: any) => {
      dialogRef.componentInstance.setDescription(res.error);
    });
  }

  resetConfigSubmit(entityDialog: EntityDialogComponent): void {
    const parent = entityDialog.parent;
    parent.router.navigate(new Array('').concat(['others', 'config-reset']));
  }
}
