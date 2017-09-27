import { Injectable } from '@angular/core';
import * as domHelper from '../../helpers/dom.helper';
@Injectable()
export class ThemeService {
  freenasThemes = [{
    name: 'egret-dark-purple',
    baseColor: '#9c27b0',
    isActive: false,
    hasDarkLogo: false
  }, {
    name: 'egret-dark-pink',
    baseColor: '#e91e63',
    isActive: false,
    hasDarkLogo: false
  }, {
    name: 'egret-blue',
    baseColor: '#2196f3',
    isActive: false,
    hasDarkLogo:true
  }, {
    name: 'egret-indigo',
    baseColor: '#3f51b5',
    isActive: false,
    hasDarkLogo: false
    }, {
    name: 'ix-blue',
    baseColor: '#0095D5',
    isActive: true,
    hasDarkLogo: true
  }, {
    name: 'freenas-warriors',
    baseColor: '#fdb927',
    isActive: false,
    hasDarkLogo: true
  }, {
    name: 'freenas-sharks',
    baseColor: '#088696',
    isActive: false,
    hasDarkLogo: false
  }];
  constructor() { }
  changeTheme(theme) {
    domHelper.changeTheme(this.freenasThemes, theme.name);
    this.freenasThemes.forEach((t) => {
      t.isActive = false;
      if(t.name === theme.name)
        t.isActive = true;
    });
  }
}
