import { Component, OnInit } from '@angular/core';
import { WebSocketService, SystemGeneralService } from '../../../services/';
import { LocaleService } from '../../../services/locale.service';
import { helptext_system_general as helptext } from 'app/helptext/system/general';

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss']
})
export class GeneralSettingsComponent implements OnInit {
  GUI: any;
  localization = [];

  constructor(private ws: WebSocketService, private localeService: LocaleService,
    private sysGeneralService: SystemGeneralService) { }

  ngOnInit(): void {
    this.ws.call('system.general.config').subscribe(res => {
      console.log(res)
      this.GUI = [
        {label: helptext.stg_guicertificate.placeholder, value: res.ui_certificate.name},
        {label: helptext.stg_guiaddress.placeholder, value: res.ui_address.join(', ')},
        {label: helptext.stg_guiv6address.placeholder, value: res.ui_v6address.join(', ')},
        {label: helptext.stg_guihttpsport.placeholder, value: res.ui_httpsport},
        {label: helptext.stg_guihttpsprotocols.placeholder, value: res.ui_httpsprotocols.join(', ')},
        {label: helptext.stg_guihttpsredirect.placeholder, value: res.ui_httpsredirect},
        {label: helptext.crash_reporting.placeholder, value: res.crash_reporting ? helptext.enabled : helptext.disabled},
        {label: helptext.usage_collection.placeholder, value: res.usage_collection ? helptext.enabled : helptext.disabled}
      ]
      
      this.sysGeneralService.languageChoices().subscribe(languages => {
        this.localization = [
          {label: helptext.stg_language.placeholder, value: languages[res.language]},
          {label: helptext.date_format.placeholder, value: this.localeService.getDateAndTime(res.timezone)[0]},
          {label: helptext.time_format.placeholder, value: this.localeService.getDateAndTime(res.timezone)[1]},
          {label: helptext.stg_kbdmap.placeholder, value: res.kbdmap ? res.kbdmap : helptext.default}
        ]
      })
    });

  }

}
