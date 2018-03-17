import { Injectable } from '@angular/core';
import * as domHelper from '../../helpers/dom.helper';
import { RestService, WebSocketService } from 'app/services';
import { CoreService, CoreEvent } from 'app/core/services/core.service';

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
    /*{
     name: 'ix-blue',
     label: 'iX Blue',
     baseColor: '#0095D5',
     accentColors:['#d238ff', '#00d0d6', '#ff0013', '#00a2ff', '#59d600', '#eec302', '#f0cb00', '#c17ecc'], // based on TangoAdapted
     isActive: true,
     hasDarkLogo: false
    }, */
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
    }
    /*{
     name: 'native',
     label: 'Native',
     baseColor: '#073642',
     accentColors:['var(--magenta)', '#2aa198', '#dc322f', '#268bd2', '#859900', '#cb4b16', '#b58900', '#6c71c4'],
     isActive: false,
     hasDarkLogo: false
    }, 
    {
      name: 'egret-dark-purple',
      label: 'Dark Purple',
      baseColor: '#9c27b0',
      accentColors:['#d238ff', '#00d0d6', '#ff0013', '#00a2ff', '#59d600', '#eec302', '#f0cb00', '#c17ecc'], // based on TangoAdapted
      isActive: false,
      hasDarkLogo: false
    },
    {
      name: 'egret-indigo',
      label: 'Indigo',
      baseColor: '#3f51b5',
      accentColors:['#d238ff', '#00d0d6', '#ff0013', '#00a2ff', '#59d600', '#eec302', '#f0cb00', '#c17ecc'], // based on TangoAdapted
      isActive: false,
      hasDarkLogo: false
    }, 
    {
      name: 'freenas-sharks',
      label: 'Sharks',
      baseColor: '#088696',
      accentColors:['#d238ff', '#00d0d6', '#ff0013', '#00a2ff', '#59d600', '#eec302', '#f0cb00', '#c17ecc'], // based on TangoAdapted
      isActive: false,
      hasDarkLogo: false
    }*/
  ];

  savedUserTheme:string = "";

  constructor(private rest: RestService, private ws: WebSocketService, private core:CoreService) {
    console.log("*** New Instance of Theme Service ***");
    if(this.ws.loggedIn){
      this.rest.get("account/users/1", {}).subscribe((res) => {
        console.log(res.data.bsdusr_attributes.usertheme);
        this.savedUserTheme = res.data.bsdusr_attributes.usertheme;

        // TEMPORARY FIX: Removed egret-blue theme but that theme is still 
        // the default in the middleware. This is a workaround until that
        // default value can be changed
        if(this.savedUserTheme == "egret-blue"){
          //this.savedUserTheme = "ix-blue";
          this.activeTheme = "ix-blue";
        } else {
          this.activeTheme = this.savedUserTheme;
        }
        //this.setCssVars(this.findTheme(this.activeTheme));

        },
      (err) => {
        //this.changeTheme(this.activeTheme);
        console.log(err);
      });
    } 
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
