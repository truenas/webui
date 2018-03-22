import { Injectable } from '@angular/core';
import * as domHelper from '../../helpers/dom.helper';
import { RestService, WebSocketService } from 'app/services';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ApiService } from 'app/core/services/api.service';

export interface Theme {
  name: string;
  description:string;
  label: string;
  labelSwatch?: string;
  //baseColor: string;
  accentColors: string[];
  //isActive?: boolean;
  favorite:boolean;
  hasDarkLogo: boolean;
  primary:string;
  accent:string;
  bg1:string
  bg2:string
  fg1:string
  fg2:string
  'alt-bg1':string
  'alt-bg2':string
  'alt-fg1':string
  'alt-fg2':string
  yellow:string
  orange:string
  red:string
  magenta:string
  violet:string
  blue:string
  cyan:string
  green:string
}

@Injectable()
export class ThemeService {
  readonly freeThemeDefaultIndex = 0;
  public activeTheme: string = 'ix-blue';
  public activeThemeSwatch: string[];

  public freenasThemes: Theme[] = [
    {
      name:'ix-blue',
      label: "iX Blue",
      labelSwatch:"blue",
      description:'iX System Colors',
      hasDarkLogo:false,
      favorite:false,
      accentColors:['blue', 'orange','green', 'violet','cyan', 'magenta', 'yellow','red'],
      primary:"var(--blue)",
      accent:"var(--yellow)",
      bg1:'#dddddd',
      bg2:'#ffffff',
      fg1:'#222222',
      fg2:'#333333',
      'alt-bg1':'#f8f8f2',
      'alt-bg2':'#fafaf5',
      'alt-fg1':'#181a26',
      'alt-fg2':'#282a36',
      yellow:'#f0cb00',
      orange:'#eec302',
      red:'#ff0013',
      magenta:'#d238ff',
      violet:'#c17ecc',
      blue:'#00a2ff',
      cyan:'#00d0d6',
      green:'#59d600'
    },
    {
      name:'dracula',
      label: "Dracula",
      labelSwatch:"blue",
      description:'Dracula color theme',
      hasDarkLogo:false,
      favorite:false,
      accentColors:['blue', 'green','violet', 'yellow', 'red', 'cyan', 'magenta', 'orange'],
      primary:"var(--blue)",
      accent:"var(--violet)",
      bg1:'#181a26',
      bg2:'#282a36',
      fg1:'#f8f8f2',
      fg2:'#fafaf5',
      'alt-bg1':'#f8f8f2',
      'alt-bg2':'#fafaf5',
      'alt-fg1':'#181a26',
      'alt-fg2':'#282a36',
      yellow:'#f1fa8c',
      orange:'#ffb86c',
      red:'#ff5555',
      magenta:'#ff79c6',
      violet:'#bd93f9',
      blue:'#6272a4',
      cyan:'#8be9fd',
      green:'#50fa7b'
    },
    {
      name:'solarized-dark',
      label: "Solarized Dark",
      labelSwatch:"bg2",
      description:'Solarized dark color scheme',
      hasDarkLogo:false,
      favorite:false,
      accentColors:['red', 'blue', 'magenta', 'cyan', 'violet', 'green', 'orange', 'yellow'],
      primary:"var(--fg1)",
      accent:"var(--cyan)",
      bg1:'#002b36',
      bg2:'#073642',
      fg1:'#586e75',
      fg2:'#657b83',
      'alt-bg1':'#eee8d5',
      'alt-bg2':'#fdf6e3',
      'alt-fg1':'#839496',
      'alt-fg2':'#282a36',
      yellow:'#b58900',
      orange:'#cb4b16',
      red:'#dc322f',
      magenta:'#d33682',
      violet:'#6c71c4',
      blue:'#268bd2',
      cyan:'#2aa198',
      green:'#859900'
    },
    {
      name:'solarized-light',
      label: "Solarized Light",
      labelSwatch:"bg2",
      description:'Based on Solarized light color scheme',
      hasDarkLogo:false,
      favorite:false,
      accentColors:['orange', 'green', 'cyan', 'yellow', 'violet', 'magenta', 'red', 'blue'],
      primary:"var(--alt-bg2)",
      accent:"var(--yellow)",
      //'bg1':'#eee8d5',
      'bg1':'#dfdac8',
      'bg2':'#fdf6e3',
      'fg1':'#839496',
      'fg2':'#282a36',
      'alt-bg1':'#002b36',
      'alt-bg2':'#073642',
      'alt-fg1':'#586e75',
      'alt-fg2':'#657b83',
      yellow:'#b58900',
      orange:'#cb4b16',
      red:'#dc322f',
      magenta:'#d33682',
      violet:'#6c71c4',
      blue:'#268bd2',
      cyan:'#2aa198',
      green:'#859900'
    }
  ];

  savedUserTheme:string = "";
  private loggedIn:boolean;

  constructor(private rest: RestService, private ws: WebSocketService, private core:CoreService, private api:ApiService) {
    console.log("*** New Instance of Theme Service ***");
    /*this.core.register({observerClass:this,eventName:"Authenticated", sender:this.api}).subscribe((evt:CoreEvent) => {
      this.loggedIn = evt.data;
      if(this.loggedIn == true){
        this.core.emit({ name:"UserDataRequest",data:[[["id", "=", "1"]]] });
      } else {
        console.warn("SETTING DEFAULT THEME");
        this.setDefaultTheme();
      }
    });*/

    this.core.register({observerClass:this,eventName:"UserData",sender: this.api}).subscribe((evt:CoreEvent) => {
      console.warn("SETTING USER THEME");
      //DEBUG: console.log(evt);
      this.savedUserTheme = evt.data[0].attributes.usertheme;

      // TEMPORARY FIX: Removed egret-blue theme but that theme is still 
      // the default in the middleware. This is a workaround until that
      // default value can be changed
      if(this.savedUserTheme == "egret-blue"){
        //this.savedUserTheme = "ix-blue";
        this.activeTheme = "ix-blue";
      } else {
        this.activeTheme = this.savedUserTheme;
      }
      this.setCssVars(this.findTheme(this.activeTheme));
    });
  }

  setDefaultTheme(){
    this.activeTheme = "ix-blue";
    this.changeTheme(this.activeTheme);
  }

  currentTheme():Theme{
    /*for(let i in this.freenasThemes){
     let t = this.freenasThemes[i];
     if(t.name == this.activeTheme.name){ return t;}
    }*/

    return this.findTheme(this.activeTheme);
  }

  findTheme(name:string):Theme{
    for(let i in this.freenasThemes){
      let t = this.freenasThemes[i];
      if(t.name == name){ return t;}
    }
  }

  changeTheme(theme:string) {
    console.log("THEME SERVICE THEMECHANGE: changing to " + theme + " theme");
    //domHelper.changeTheme(this.freenasThemes, this.activeTheme);
    this.activeTheme = theme;
    /*this.freenasThemes.forEach((t) => {
     t.isActive = (t.name === theme.name);
    });*/
    if(this.ws.loggedIn){
      this.saveCurrentTheme();
    }
    this.setCssVars(this.findTheme(theme));
    this.core.emit({name:'ThemeChanged'});
  }

  saveCurrentTheme(){
    let theme = this.currentTheme();
    this.ws.call('user.update', [1,{attributes:{usertheme:theme.name}}]).subscribe((res) => {
      console.log("Saved usertheme:", res, theme.name);
    });
  }

  setCssVars(theme:Theme){
    let palette = Object.keys(theme);
    palette.splice(0,7);

    palette.forEach(function(color){
      let swatch = theme[color];
      (<any>document).documentElement.style.setProperty("--" + color, theme[color]);
    });
    (<any>document).documentElement.style.setProperty("--primary",theme["primary"]);
    (<any>document).documentElement.style.setProperty("--accent",theme["accent"]);
  }

}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
