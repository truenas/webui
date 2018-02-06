import { Injectable } from '@angular/core';
import * as domHelper from '../../helpers/dom.helper';
import { RestService, WebSocketService } from 'app/services';
import { CoreService, CoreEvent } from 'app/core/services/core.service';

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
  readonly freeThemeDefaultIndex = 0;

  public freenasThemes: Theme[] = [
    {
      name: 'ix-blue',
      label: 'iX Blue',
      baseColor: '#0095D5',
      accentColors:['#d238ff', '#00d0d6', '#ff0013', '#00a2ff', '#59d600', '#eec302', '#f0cb00', '#c17ecc'], // based on TangoAdapted
      isActive: true,
      hasDarkLogo: false
    }, 
    {
      name: 'solarized-dark',
      label: 'Solarized Dark',
      baseColor: '#073642',
      accentColors:['#d33682', '#2aa198', '#dc322f', '#268bd2', '#859900', '#cb4b16', '#b58900', '#6c71c4'],
      // Order is magenta, cyan, red, blue, green, orange, yellow, violet
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
    }, 
    {
      name: 'egret-dark-purple',
      label: 'Dark Purple',
      baseColor: '#9c27b0',
      isActive: false,
      hasDarkLogo: false
    },
    {
      name: 'egret-indigo',
      label: 'Indigo',
      baseColor: '#3f51b5',
      isActive: false,
      hasDarkLogo: false
    }, 
    {
      name: 'freenas-sharks',
      label: 'Sharks',
      baseColor: '#088696',
      isActive: false,
      hasDarkLogo: false
    }
    /*{
      name: 'egret-dark-pink',
      label: 'Dark Pink',
      baseColor: '#e91e63',
      isActive: false,
      hasDarkLogo: false
    },*/ 
    /*{
      name: 'egret-blue',
      label: 'Blue',
      baseColor: '#2196f3',
      isActive: false,
      hasDarkLogo: true
    }, */
    /*{
      name: 'freenas-warriors',
      label: 'Warriors',
      baseColor: '#fdb927',
      isActive: false,
      hasDarkLogo: true
    }, */
  ];

  savedUserTheme = "";

  constructor(private rest: RestService, private ws: WebSocketService, private core:CoreService) {

    this.rest.get("account/users/1", {}).subscribe((res) => {
      console.log("******** THEME SERVICE CONTRUCTOR ********");
      console.log(res.data);
      this.savedUserTheme = res.data.bsdusr_attributes.usertheme;

      // TEMPORARY FIX: Removed egret-blue theme but that theme is still 
      // the default in the middleware. This is a workaround until that
      // default value can be changed
      if(this.savedUserTheme == "egret-blue"){
        this.savedUserTheme = "ix-blue";
      }

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
    //this.saveCurrentTheme();
    this.core.emit({name:'ThemeChanged'});
  }

  saveCurrentTheme(){
    let theme = this.currentTheme();
    //this.rest.put("account/users/1", {bsdusr_attributes:{usertheme:theme.name}}).subscribe((res) => {
    this.ws.call('user.update', [1,{attributes:{usertheme:theme.name}}]).subscribe((res) => {
      console.log("Saved usertheme:", res, theme.name);
    });
  }
}
