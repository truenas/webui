import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService, SystemGeneralService, DialogService, LanguageService } from '../../../services/';
import { LocaleService } from '../../../services/locale.service';
import { ModalService } from '../../../services/modal.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../../../services/storage.service';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { LocalizationFormComponent } from './localization-form/localization-form.component';
import { GuiFormComponent } from './gui-form/gui-form.component';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss']
})
export class GeneralSettingsComponent implements OnInit, OnDestroy {
  dataCards = [];
  supportTitle = helptext.supportTitle;
  ntpTitle = helptext.ntpTitle;
  localeData: any;
  configData: any;
  refreshCardData: Subscription;
  protected localizationComponent = new LocalizationFormComponent(this.language,this.ws,this.dialog,this.loader,
    this.sysGeneralService,this.localeService,this.modalService);
  protected guiComponent = new GuiFormComponent(this.router,this.language,this.ws,this.dialog,this.loader,
    this.http,this.storage,this.sysGeneralService,this.modalService)

  constructor(private ws: WebSocketService, private localeService: LocaleService,
    private sysGeneralService: SystemGeneralService, private modalService: ModalService,
    private language: LanguageService, private dialog: DialogService, private loader: AppLoaderService,
    private router: Router, private http: HttpClient, private storage: StorageService) { }

  ngOnInit(): void {
    this.getDataCardData();
    this.refreshCardData = this.sysGeneralService.refreshSysGeneral$.subscribe(() => {
      this.getDataCardData();
    })
  }

  getDataCardData() {
    this.ws.call('system.general.config').subscribe(res => {
      this.configData = res;
      this.dataCards = [ 
        {
          title: helptext.guiTitle,
          id: 'gui',
          items: [
            {label: helptext.stg_guicertificate.placeholder, value: res.ui_certificate.name},
            {label: helptext.stg_guiaddress.placeholder, value: res.ui_address.join(', ')},
            {label: helptext.stg_guiv6address.placeholder, value: res.ui_v6address.join(', ')},
            {label: helptext.stg_guihttpsport.placeholder, value: res.ui_httpsport},
            {label: helptext.stg_guihttpsprotocols.placeholder, value: res.ui_httpsprotocols.join(', ')},
            {label: helptext.stg_guihttpsredirect.placeholder, value: res.ui_httpsredirect},
            {label: helptext.crash_reporting.placeholder, value: res.crash_reporting ? helptext.enabled : helptext.disabled},
            {label: helptext.usage_collection.placeholder, value: res.usage_collection ? helptext.enabled : helptext.disabled}
          ]
        }
      ];
     
      this.sysGeneralService.languageChoices().subscribe(languages => {
        this.sysGeneralService.kbdMapChoices().subscribe(mapchoices => {
          const keyboardMap = mapchoices.find(x => x.value === this.configData.kbdmap);
          this.localeData = 
          {
            title: helptext.localeTitle,
            id: 'localization',
            items: [
              {label: helptext.stg_language.placeholder, value: languages[res.language]},
              {label: helptext.date_format.placeholder, value: this.localeService.getDateAndTime(res.timezone)[0]},
              {label: helptext.time_format.placeholder, value: this.localeService.getDateAndTime(res.timezone)[1]},
              {label: helptext.stg_timezone.placeholder, value: res.timezone},
              {label: helptext.stg_kbdmap.placeholder, value: res.kbdmap ? keyboardMap.label : helptext.default}
            ]
          };
          this.dataCards.push(this.localeData);
        })
      })
    });
  }
  
  doAdd(id: string) {
    const addComponent = id === 'gui' ? this.guiComponent : this.localizationComponent;
    this.sysGeneralService.sendConfigData(this.configData);
    this.modalService.open('slide-in-form', addComponent);
  }  

  ngOnDestroy() {
    this.refreshCardData.unsubscribe();
  }

}
