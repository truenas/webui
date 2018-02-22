import 'rxjs/add/operator/map';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';
import { TranslateService } from 'ng2-translate/ng2-translate';
import * as _ from 'lodash';

@Injectable()
export class LanguageService {

  currentLang = 'en';
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
    const browserLang = this.translate.getBrowserLang();
    if (_.find(this.availableLangs, {"code": browserLang})) {
      this.currentLang = browserLang;
    }

    this.translate.use(this.currentLang);
  }
}