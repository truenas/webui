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
  accentColors: string[];
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

  // Theme lists
  public allThemes: Theme[];
  public favoriteThemes: Theme[];
  public themesMenu: Theme[];
  private _customThemes: Theme[];

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
  public globalPreview: boolean = false;
  public globalPreviewData: any;

  constructor(private rest: RestService, private ws: WebSocketService, private core:CoreService, private api:ApiService) {
    console.log("*** New Instance of Theme Service ***");
    
    // Set default list
    this.allThemes = this.freenasThemes;
    this.themesMenu = this.freenasThemes;

    this.core.register({observerClass:this,eventName:"Authenticated", sender:this.api}).subscribe((evt:CoreEvent) => {
      this.loggedIn = evt.data;
      if(this.loggedIn == true){
        this.core.emit({ name:"UserDataRequest",data:[[["id", "=", "1"]]] });
      } else {
        //console.warn("SETTING DEFAULT THEME");
        this.setDefaultTheme();
      }
    });

    this.core.register({observerClass:this,eventName:"GlobalPreviewChanged"}).subscribe((evt:CoreEvent) => {
      
      //this.globalPreview = !this.globalPreview;
      if(evt.data){
        this.globalPreview = true;
      } else {
        this.globalPreview = false;
      }
      this.globalPreviewData = evt.data;
      if(this.globalPreview){
        this.setCssVars(evt.data.theme);
      } else if(!this.globalPreview){
        this.setCssVars(this.findTheme(this.activeTheme));
        this.globalPreviewData = null;
      }
    });

    this.core.register({observerClass:this,eventName:"UserPreferencesChanged"}).subscribe((evt:CoreEvent) => {
      if(evt.data.customThemes){
        //console.log("Custom Themes Detected");
        this.customThemes = evt.data.customThemes;
      }

      if(evt.data.userTheme !== this.activeTheme){
        this.activeTheme = evt.data.userTheme;
        this.setCssVars(this.findTheme(this.activeTheme));
        this.core.emit({name:'ThemeChanged'});
      }

      if(evt.data.showTooltips){
        (<any>document).documentElement.style.setProperty("--tooltip","inline");
      } else if(!evt.data.showTooltips){
        (<any>document).documentElement.style.setProperty("--tooltip","none");
      }
    });
  }

  setDefaultTheme(){
    this.activeTheme = "ix-blue";
    this.changeTheme(this.activeTheme);
  }

  currentTheme():Theme{
    return this.findTheme(this.activeTheme);
  }

  findTheme(name:string):Theme{
    for(let i in this.allThemes){
      let t = this.allThemes[i];
      if(t.name == name){ return t;}
    }
  }

  changeTheme(theme:string) {
    //console.log("THEME SERVICE THEMECHANGE: changing to " + theme + " theme");
    this.core.emit({name:"ChangeThemePreference", data:theme, sender:this});
    //this.core.emit({name:'ThemeChanged'});
  }

  saveCurrentTheme(){
    //console.log("SAVING CURRENT THEME");
    let theme = this.currentTheme();
    this.core.emit({name:"ChangeThemePreference", data:theme.name});
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

  get customThemes(){
    return this._customThemes;
  }

  set customThemes(customThemes:Theme[]){
    let result = [];
    for(let i = 0; i < customThemes.length; i++){
      if(customThemes[i].favorite){
        result.push(customThemes[i]);
      }
    }
    this._customThemes = customThemes;
    this.favoriteThemes = result; 
    this.allThemes = this.freenasThemes.concat(this.customThemes);
    this.themesMenu = this.freenasThemes.concat(this.favoriteThemes);
    this.core.emit({name:"ThemeListsChanged"});
  }

}
