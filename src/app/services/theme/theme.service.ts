import { Injectable } from '@angular/core';
import * as domHelper from '../../helpers/dom.helper';
@Injectable()
export class ThemeService {
  freenasThemes = [{
    name: 'egret-dark-purple',
    label: 'Dark Purple',
    baseColor: '#9c27b0',
    isActive: false,
    hasDarkLogo: false
  }, {
    name: 'egret-dark-pink',
    label: 'Dark Pink',
    baseColor: '#e91e63',
    isActive: false,
    hasDarkLogo: false
  }, {
    name: 'egret-blue',
    label: 'Blue',
    baseColor: '#2196f3',
    isActive: false,
    hasDarkLogo: true
  }, {
    name: 'ix-blue',
    label: 'iX Blue',
    baseColor: '#0095D5',
    isActive: true,
    hasDarkLogo: false
  }, {
    name: 'egret-indigo',
    label: 'Indigo',
    baseColor: '#3f51b5',
    isActive: false,
    hasDarkLogo: false
  }, {
    name: 'freenas-warriors',
    label: 'Warriors',
    baseColor: '#fdb927',
    isActive: false,
    hasDarkLogo: true
  }, {
    name: 'freenas-sharks',
    label: 'Sharks',
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
