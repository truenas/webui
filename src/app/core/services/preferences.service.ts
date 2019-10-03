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
  showTooltips?:boolean; // Form Tooltips on/off // Deprecated, remove in v12!
  metaphor:string; // Prefer Cards || Tables || Auto (gui decides based on data array length)
  allowPwToggle:boolean;
  preferIconsOnly:boolean;
  rebootAfterManualUpdate:boolean;
  tableDisplayedColumns:any;
}

@Injectable()
export class PreferencesService {
  //public coreEvents: Subject<CoreEvent>;
  private debug = false;
  public preferences: UserPreferences = {
    "platform":"freenas",// Detect platform
    "timestamp":new Date(),
    "userTheme":"ix-dark", // Theme name
    "customThemes": [], // Theme Objects
    "favoriteThemes": [], // Theme Names
    "showGuide":true,
    "showTooltips":true,
    "metaphor":"auto",
    "allowPwToggle":true,
    "preferIconsOnly": false,
    "rebootAfterManualUpdate": false,
    "tableDisplayedColumns":[]
  }
  constructor(protected core: CoreService, protected themeService: ThemeService,private api:ApiService,private router:Router,
    private aroute: ActivatedRoute) {

    this.core.register({observerClass:this, eventName:"Authenticated",sender:this.api}).subscribe((evt:CoreEvent) => {
      // evt.data: boolean = authentication status
      if(evt.data){
        this.core.emit({name:"UserPreferencesRequest"});
      }
    });

    this.core.register({observerClass:this, eventName:"UserPreferencesRequest"}).subscribe((evt:CoreEvent) => {
      if(!evt.data){
        this.core.emit({name:"UserDataRequest", data: [[[ "id", "=", 1 ]]]});
      } else {
        // Uncomment the line below when multi-user support is implemented in middleware
        //this.core.emit({name:"UserDataRequest", data: [[[ "id", "=", evt.data ]]]});
        if(this.debug){ console.warn("Multiple users not supported by middleware"); }
      }
    });

    this.core.register({observerClass:this, eventName:"UserData", sender:this.api }).subscribe((evt:CoreEvent) => {
      if (evt.data[0]) {
        const data = evt.data[0].attributes.preferences;

        const preferencesFromUI = Object.keys(this.preferences);
        if(!data){
          // If preferences do not exist return after saving Preferences so that UI can retry.
          if(this.debug)console.log('Preferences not returned');
          this.savePreferences();
          console.warn("No Preferences Found in Middleware");
          return;
        }

        const preferencesFromMiddleware = Object.keys(data);
        const keysMatch:boolean = (preferencesFromUI.join() == preferencesFromMiddleware.join());// evaluates as false negative, wth?!
        if(data && keysMatch){
          // If preferences exist and there are no unknown properties
          if(this.debug)console.log('Preferences exist');
          this.updatePreferences(data);
        } else if(data && !keysMatch){
          // Add missing properties to inbound preferences from middleware
          if(this.debug){
            console.log('Preferences exist and there are unknown properties');
            //console.log(preferencesFromMiddleware)
            //console.log(preferencesFromUI)
          }
          const merged = this.mergeProperties(this.preferences, data);
          this.updatePreferences(data);
        } else if(!data){
          // If preferences do not exist
          if(this.debug)console.log('Preferences not returned');
          this.savePreferences();
          console.warn("No Preferences Found in Middleware");
        }

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
      //console.log("UPDATING LOCAL PREFERENCES");
      this.preferences = data;

      //Notify Guided Tour & Theme Service
      this.core.emit({name:"UserPreferencesChanged", data:this.preferences});
  }

  // Save to middleware
  savePreferences(data?:UserPreferences){
    if(!data){
      data = this.preferences;
    }
    this.core.emit({name:"UserDataUpdate", data:data});
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

  mergeProperties(fui, fmw){
    // Use this to add newer properties from middleware responses
    // fetched after updates. Handy for when update contains new
    // preference options.
    // fui = from UI && fmw = from middleware
    const merged = Object.assign(fmw, {});
    const keys = Object.keys(fui);
    const newProps = keys.filter(x => !fmw[x]);
    
    newProps.forEach((item, index) => {
    	merged[item] = fui[item];	
    });
    return merged;
  }

}
