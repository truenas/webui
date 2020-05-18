import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CoreService, CoreEvent } from './core.service';
import { ApiService } from './api.service';
import { ThemeService, Theme } from 'app/services/theme/theme.service';

interface PropertyReport {
  middlewareProperties: string[];
  serviceProperties: string[];
  deprecatedProperties: string[];
  newProperties: string[];
}

export interface UserPreferences {
  platform:string; // FreeNAS || TrueNAS
  retroLogo?: boolean; // Brings back FreeNAS branding
  timestamp:Date;
  userTheme:string; // Theme name
  customThemes?: Theme[]; 
  favoriteThemes?: string[]; // Deprecate
  showGuide:boolean; // Guided Tour on/off
  showTooltips?:boolean; // Form Tooltips on/off // Deprecated, remove in v12!
  metaphor:string; // Prefer Cards || Tables || Auto (gui decides based on data array length)
  allowPwToggle:boolean;
  preferIconsOnly:boolean;
  rebootAfterManualUpdate:boolean;
  tableDisplayedColumns:any;
  hide_builtin_users: boolean;
  hide_builtin_groups: boolean;
  dateFormat:string;
  timeFormat:string;
  nicType:string
  nicAttach: string,
  showWelcomeDialog: boolean;
  showUserListMessage: boolean;
  showGroupListMessage: boolean;
}

@Injectable()
export class PreferencesService {
  private debug = false;
  private startupComplete: boolean = false;
  public defaultPreferences: UserPreferences = {
    "platform":"freenas",// Detect platform
    "retroLogo": false,
    "timestamp":new Date(),
    "userTheme":"default", // Theme name
    "customThemes": [], // Theme Objects
    "favoriteThemes": [], // Theme Names
    "showGuide":true,
    "showTooltips":true,
    "metaphor":"auto",
    "allowPwToggle":true,
    "preferIconsOnly": false,
    "rebootAfterManualUpdate": false,
    "tableDisplayedColumns":[],
    "hide_builtin_users": true,
    "hide_builtin_groups": true,
    "dateFormat": 'YYYY-MM-DD',
    "timeFormat": 'HH:mm:ss',
    "nicType": null,
    "nicAttach": null,
    "showWelcomeDialog": true,
    "showUserListMessage": true,
    "showGroupListMessage": true
  }

  public preferences: UserPreferences = this.defaultPreferences;

  constructor(protected core: CoreService, protected themeService: ThemeService,private api:ApiService,private router:Router,
    private aroute: ActivatedRoute) {

    this.core.register({observerClass:this, eventName:"Authenticated",sender:this.api}).subscribe((evt:CoreEvent) => {
      // evt.data: boolean represents authentication status
      if(evt.data){
        this.core.emit({name:"UserDataRequest", data: [[[ "id", "=", 1 ]]]});
      }
    });

    this.core.register({observerClass:this, eventName:"UserPreferencesRequest"}).subscribe((evt:CoreEvent) => {
      // Ignore requests until we have UserData
      if(!this.startupComplete){return;}

      if(!evt.data){
        this.core.emit({name:"UserDataRequest", data: [[[ "id", "=", 1 ]]]});
      } else {
        if(this.debug){ console.warn("Multiple users not supported by middleware"); }
      }
    });

    this.core.register({observerClass:this, eventName:"UserData", sender:this.api }).subscribe((evt:CoreEvent) => {

      if (evt.data[0]) {
        const data = evt.data[0].attributes.preferences;
        if(!data){
          // If preferences do not exist return after saving Preferences so that UI can retry.
          if(this.debug)console.log('Preferences not returned');
          this.savePreferences();
          console.warn("No Preferences Found in Middleware");
          return;
        }

        this.updatePreferences(data);
      }

      if(!this.startupComplete){
        this.core.emit({name:"UserPreferencesReady", data:this.preferences, sender: this});
        this.startupComplete = true;
      }

    });

    this.core.register({observerClass:this, eventName:"ChangeThemePreference",sender:this.themeService}).subscribe((evt:CoreEvent) => {
      this.preferences.userTheme = evt.data;
      this.core.emit({name:"UserDataUpdate", data:this.preferences  });
    });

    this.core.register({observerClass:this, eventName:"ChangeCustomThemesPreference"}).subscribe((evt:CoreEvent) => {
      this.preferences.customThemes = evt.data;
      this.core.emit({name:"UserDataUpdate", data:this.preferences  });
    });

    this.core.register({observerClass:this, eventName:"AddCustomThemePreference"}).subscribe((evt:CoreEvent) => {
      let newTheme:Theme;
      newTheme = evt.data;
      this.preferences.customThemes.push(newTheme);
      this.preferences.userTheme = evt.data.name;
      this.core.emit({name:"UserDataUpdate", data:this.preferences  });
    });

    this.core.register({observerClass:this, eventName:"ReplaceCustomThemePreference"}).subscribe((evt:CoreEvent) => {
      let oldTheme: Theme;
      const newTheme = evt.data;
      const replaced:boolean = this.replaceCustomTheme(oldTheme,newTheme);
      if(replaced){
        this.core.emit({name:"UserDataUpdate", data:this.preferences});
      }
    });

    // Reset the entire preferences object to default
    this.core.register({observerClass:this, eventName:"ResetPreferences"}).subscribe((evt:CoreEvent) => {
      let prefs = Object.assign(this.defaultPreferences, {});
      prefs.customThemes = this.preferences.customThemes;
      prefs.timestamp = new Date();
      this.savePreferences(prefs);
    });

    // Change the entire preferences object at once
    this.core.register({observerClass:this, eventName:"ChangePreferences"}).subscribe((evt:CoreEvent) => {
      let prefs = this.preferences;
      Object.keys(evt.data).forEach(function(key){
        prefs[key] = evt.data[key];
      });
      this.setShowGuide(evt.data.showGuide);
      this.preferences.timestamp = new Date();
      this.savePreferences(this.preferences);
    })

    // Change a single preference item
    this.core.register({observerClass:this, eventName:"ChangePreference"}).subscribe((evt:CoreEvent) => {
      let prefs = Object.assign(this.preferences, {});
      prefs[evt.data.key] = evt.data.value;
      prefs.timestamp = new Date();
      this.preferences = prefs;
      this.setShowGuide(evt.data.showGuide);
      this.savePreferences(this.preferences);
    })
  }

  // Update local cache
  updatePreferences(data:UserPreferences){

    if(data && !this.startupComplete && this.debug){
      console.warn(data);
      const report = this.sanityCheck(data);
      console.log(report);
    }
    
    let clone = Object.assign({}, this.preferences);
    const keys = Object.keys(clone);
    keys.forEach((key) => {
      if(clone[key] !== null && data[key] !== null){
        // If middleware object contains a valid key, store the value
        clone[key] = data[key];
      }
    });
    this.preferences = clone;

    if(this.startupComplete){ 
      //Notify Guided Tour & Theme Service
      this.core.emit({name:"UserPreferencesChanged", data:this.preferences, sender: this});
    } 
    
  }

  // Save to middleware
  savePreferences(data?:UserPreferences){
    if(!data){
      data = this.preferences;
    }
    this.core.emit({name:"UserDataUpdate", data:data});
    if(this.debug){ console.log({SavingPreferences: this.preferences});}
  }

  replaceCustomTheme(oldTheme:Theme, newTheme:Theme):boolean{
    const index = this.preferences.customThemes.indexOf(oldTheme);
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

  sanityCheck(data:UserPreferences):PropertyReport{
    let oldKeys = [];
    let newKeys = [];

    const savedKeys = Object.keys(data);
    const currentKeys = Object.keys(this.preferences);

    // Find Deprecated
    oldKeys = savedKeys.filter((key) => {
      return currentKeys.indexOf(key) == -1;
    });
    if(this.debug && oldKeys.length > 0)console.log(oldKeys.length + " Deprecated Preferences Found!");

    // Find New 
    newKeys = currentKeys.filter((key) => {
      return savedKeys.indexOf(key) == -1;
    });
    if(this.debug && newKeys.length > 0)console.log(newKeys.length + " New Preferences Found!");
    

    const report: PropertyReport = {
      middlewareProperties: savedKeys, // Inbound from Middleware
      serviceProperties: currentKeys, // Stored in the service
      deprecatedProperties: oldKeys, // Deprecated
      newProperties: newKeys // New Keys
    }

    return report;
  }

}
