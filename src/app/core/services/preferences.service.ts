import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CoreService, CoreEvent } from './core.service';
import { ApiService } from './api.service';
import { ThemeService, Theme } from 'app/services/theme/theme.service';
export interface UserPreferences {
  platform:string; // FreeNAS || TrueNAS
  timestamp:Date;
  userTheme:string; // Theme name
  customThemes?: Theme[]; 
  favoriteThemes?: string[]; // Theme Names
  showGuide:boolean; // Guided Tour on/off
  showTooltips:boolean; // Form Tooltips on/off
  metaphor:string; // Prefer Cards || Tables || Auto (gui decides based on data array length)
  allowPwToggle:boolean;
  hideWarning:boolean;
}

@Injectable()
export class PreferencesService {
  //public coreEvents: Subject<CoreEvent>;
  public preferences: UserPreferences = {
    "platform":"freenas",
    "timestamp":new Date(),
    "userTheme":"ix-blue", // Theme name
    "customThemes": [], // Theme Objects
    "favoriteThemes": [], // Theme Names
    "showGuide":true,
    "showTooltips":true,
    "metaphor":"auto",
    "allowPwToggle":true,
    "hideWarning": true
  }
  constructor(protected core: CoreService, protected themeService: ThemeService,private api:ApiService,private router:Router,
    private aroute: ActivatedRoute) {

    this.core.register({observerClass:this, eventName:"Authenticated",sender:this.api}).subscribe((evt:CoreEvent) => {
      //console.log(evt.data);
      if(evt.data){
        this.core.emit({name:"UserDataRequest", data: [[["id", "=", 1 ]]] });
      }
    });

    this.core.register({observerClass:this, eventName:"UserData", sender:this.api }).subscribe((evt:CoreEvent) => {
      let data = evt.data[0].attributes.preferences;

      let preferencesFromUI = Object.keys(this.preferences);
      let preferencesFromMiddleware = Object.keys(data);
      let keysMatch = (preferencesFromUI == preferencesFromMiddleware);
      if(data && keysMatch){
        // If preferences exist and there are no unknown properties
        this.updatePreferences(data);
      } else if(data && !keysMatch){
        // Add missing properties to inbound preferences from middleware
        let merged = this.mergeProperties(this.preferences, data);
        this.updatePreferences(data);
      } else if(!data){
        // If preferences do not exist
        this.savePreferences();
        console.warn("No Preferences Found in Middleware");
      }
    });

    this.core.register({observerClass:this, eventName:"ChangeThemePreference",sender:this.themeService}).subscribe((evt:CoreEvent) => {
        this.preferences.userTheme = evt.data;
        this.core.emit({name:"UserDataUpdate", data:this.preferences  });
    });

    this.core.register({observerClass:this, eventName:"ChangeCustomThemesPreference"}).subscribe((evt:CoreEvent) => {
        this.preferences.customThemes = evt.data;
        //console.log("New Custom Themes List!");
        //console.log(this.preferences);
        this.core.emit({name:"UserDataUpdate", data:this.preferences  });
    });

    this.core.register({observerClass:this, eventName:"AddCustomThemePreference"}).subscribe((evt:CoreEvent) => {
        //console.log(this.preferences);
        let newTheme:Theme;
        newTheme = evt.data;
        this.preferences.customThemes.push(newTheme);
        this.core.emit({name:"UserDataUpdate", data:this.preferences  });
        //console.log(this.preferences);
    });

    this.core.register({observerClass:this, eventName:"ReplaceCustomThemePreference"}).subscribe((evt:CoreEvent) => {
        let oldTheme:Theme;
        let newTheme = evt.data;
        let replaced:boolean = this.replaceCustomTheme(oldTheme,newTheme);
        if(replaced){
          this.core.emit({name:"UserDataUpdate", data:this.preferences});
        }
    });

    this.core.register({observerClass:this, eventName:"ChangePreferences"}).subscribe((evt:CoreEvent) => {
      //console.log("ChangePreferences");
      //console.log(evt.data);
      let prefs = this.preferences;
      Object.keys(evt.data).forEach(function(key){
        prefs[key] = evt.data[key];
      });
      this.setShowGuide(evt.data.showGuide);
      this.preferences.timestamp = new Date();
      this.savePreferences(this.preferences);
    })
  }

  // Update local cache
  updatePreferences(data:UserPreferences){
    if (this.router.url != '/sessions/signin') {
      //console.log("UPDATING LOCAL PREFERENCES");
      this.preferences = data;

      //Notify Guided Tour & Theme Service
      this.core.emit({name:"UserPreferencesChanged", data:this.preferences});
    } else {
      setTimeout(()=> {
        this.updatePreferences(data);
      }, 10);
    }
  }

  // Save to middleware
  savePreferences(data?:UserPreferences){
    console.log(data);
    if(!data){
      data = this.preferences;
    }
    this.core.emit({name:"UserDataUpdate", data:data});
  }

  replaceCustomTheme(oldTheme:Theme, newTheme:Theme):boolean{
    let index = this.preferences.customThemes.indexOf(oldTheme);
    if(index && index >= 0){
      this.preferences.customThemes[index] = newTheme;
      return true;
    }
    return false;
  }

  setShowGuide(value:boolean){
    if(value){
      localStorage.setItem(this.router.url,'true')
    } else if(!value) {
      localStorage.setItem(this.router.url,'false')
    }
  }

  mergeProperties(fui, fmw){
    // Use this to add newer properties from middleware responses
    // fetched after updates. Handy for when update contains new
    // preference options.
    // fui = from UI && fmw = from middleware
    let merged = Object.assign(fmw, {});
    let keys = Object.keys(fui);
    let newProps = keys.filter(x => !fmw[x]);
    
    newProps.forEach((item, index) => {
    	merged[item] = fui[item];	
    });
    return merged;
  }

}
