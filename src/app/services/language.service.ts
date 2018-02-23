import 'rxjs/add/operator/map';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';
import { TranslateService } from 'ng2-translate/ng2-translate';
import * as _ from 'lodash';

@Injectable()
export class LanguageService {

  currentLang = '';
  availableLangs = [{
    name: 'English',
    code: 'en',
  }, {
    name: 'Español',
    code: 'es',
  }, {
    name: '中文',
    code: 'zh',
  }]

  constructor(protected translate: TranslateService) {
  }

  getBrowserLanguage() {
    if (this.currentLang === '') { // we only want it to grab the browser language once
      const browserLang = this.translate.getBrowserLang();
      this.setLang(browserLang);
    }
  }

  setLang(lang: any) {
    if (_.find(this.availableLangs, {"code": lang})) {
      this.currentLang = lang;
    } else {
      this.currentLang = 'en';
    }

    this.translate.use(this.currentLang);
  }
}