import 'rxjs/add/operator/map';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';

import { RestService } from './rest.service'

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
    code: 'zh-hans',
  }];
  system_resource = 'system/settings';

  constructor(protected translate: TranslateService, protected rest: RestService) {
  }

  getBrowserLanguage() {
    if (this.currentLang === '') { // we only want it to grab the browser language once
      const browserLang = this.translate.getBrowserLang();
      this.setLang(browserLang);
    }
  }

  getMiddlewareLanguage() {
    this.rest.get(this.system_resource, {}).subscribe((res) => {
      if (res.data && res.data.stg_language) {
        this.setLang(res.data.stg_language);
      } else {
        this.getBrowserLanguage();
      }
    });
  }

  setMiddlewareLanguage(lang: any) {
    this.rest.put(this.system_resource, 
      {body: JSON.stringify({stg_language: lang})}).subscribe(
    (res) => {
    },
    (err) => {
      console.log(err);
    });
    this.setLang(lang);
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