import { Injectable } from '@angular/core';
import * as domHelper from '../../helpers/dom.helper';
import { RestService, WebSocketService } from 'app/services';

export interface Theme {
  name: string;
  label: string;
  baseColor: string;
  accentColors?: string[];
  isActive: boolean;
  hasDarkLogo: boolean
}

@Injectable()
export class ThemeService {
  readonly freeThemeDefaultIndex = 3;

  public freenasThemes: Theme[] = [
    {
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
      accentColors:['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896'],
      isActive: true,
      hasDarkLogo: false
    }, {
      name: 'egret-indigo',
      label: 'Indigo',
      baseColor: '#3f51b5',
      isActive: false,
      hasDarkLogo: false
    }, {
      name: 'solarized-dark',
      label: 'Solarized Dark',
      baseColor: '#073642',
      accentColors:['#d33682', '#2aa198', '#dc322f', '#268bd2', '#859900', '#cb4b16', '#b58900', '#6c71c4'],
      /*
       $yellow:    #b58900;
       $orange:    #cb4b16;
       $red:       #dc322f;
       $magenta:   #d33682;
       $violet:    #6c71c4;
       $blue:      #268bd2;
       $cyan:      #2aa198;
       $green:     #859900;
       * */
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

  currentTheme(){
    for(let i in this.freenasThemes){
      let t = this.freenasThemes[i];
      if(t.isActive){ return t;}
    }
  }

  changeTheme(theme) {
    domHelper.changeTheme(this.freenasThemes, theme.name);
    this.freenasThemes.forEach((t) => {
      t.isActive = (t.name === theme.name);
    });

    this.ws.call('user.set_attribute', [1, 'usertheme', theme.name]).subscribe((res_ws) => {
      console.log("Saved usertheme:", res_ws, theme.name);
    });
  }
}
