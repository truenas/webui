import 'rxjs/add/operator/map';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';
import { TranslateService } from 'ng2-translate/ng2-translate';
import * as _ from 'lodash';

import { RestService } from './rest.service'

@Injectable()
export class LanguageService {

  currentLang = '';
  // the editor doesn't 100% sync with all of the languages the middleware 
  // uses so we must map some languages like zh_hans
  availableLangs = [{
    name: 'English',
    code: 'en',
    map: '',
  }, {
    name: 'Español',
    code: 'es',
    map: '',
  }, {
    name: '中文',
    code: 'zh',
    map: 'zh-hans'
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
    let l = _.find(this.availableLangs, {"code": lang});
    if (l.map !== '') {
      lang = l.map;
    }
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
    let l = _.find(this.availableLangs, {"map": lang});
    if (l) {
      lang = l.code;
    }
    if (_.find(this.availableLangs, {"code": lang})) {
      this.currentLang = lang;
    } else {
      this.currentLang = 'en';
    }

    this.translate.use(this.currentLang);
  }
}