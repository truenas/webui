import { Injectable } from '@angular/core';
import * as domHelper from '../../helpers/dom.helper';
import { RestService, WebSocketService } from 'app/services';
@Injectable()
export class ThemeService {
  readonly freeThemeDefaultIndex = 3;

  public freenasThemes = [{
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

  savedUserTheme = "";

  constructor(private rest: RestService, private ws: WebSocketService) {

    this.rest.get("account/users/1", {}).subscribe((res) => {
      this.savedUserTheme = res.data.bsdusr_attributes.usertheme;
      this.freenasThemes.forEach((t) => {
        t.isActive = (t.name === this.savedUserTheme);
      });

      if( typeof(this.savedUserTheme) !== "undefined" && this.savedUserTheme !== "" ) {
        domHelper.changeTheme(this.freenasThemes, this.savedUserTheme);
      } else {{
        this.freenasThemes[this.freeThemeDefaultIndex].isActive = true;
      }}

    });
  }


  changeTheme(theme) {
    domHelper.changeTheme(this.freenasThemes, theme.name);
    this.freenasThemes.forEach((t) => {
      t.isActive = (t.name === theme.name);
    });

    this.ws.call('user.update', [1, {
      attributes: {
        usertheme: theme.name
      }
    }]).subscribe((res_ws) => {
      console.log("Saved usertheme:", res_ws, theme.name);
    });
  }
}
