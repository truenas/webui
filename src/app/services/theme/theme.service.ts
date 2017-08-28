import { Injectable } from '@angular/core';
import * as domHelper from '../../helpers/dom.helper';
@Injectable()
export class ThemeService {
  freenasThemes = [{
    name: 'egret-dark-purple',
    baseColor: '#9c27b0',
    isActive: false
  }, {
    name: 'egret-dark-pink',
    baseColor: '#e91e63',
    isActive: true
  }, {
    name: 'egret-blue',
    baseColor: '#247ba0',
    isActive: false
  }, {
    name: 'egret-indigo',
    baseColor: '#3f51b5',
    isActive: false
  }, {
    name: 'freenas-warriors',
    baseColor: '#fdb927',
    isActive: false
  }, {
    name: 'freenas-sharks',
    baseColor: '#088696',
    isActive: false
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