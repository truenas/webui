import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';
import { CoreService, CoreEvent } from './core.service';
import { ApiService } from './api.service';
import { ThemeService, Theme } from 'app/services/theme/theme.service';
import * as moment from 'moment';

export interface UserPreferences {
  platform:string; // FreeNAS || TrueNAS
  timestamp:Date;
  userTheme:string; // Theme name
  customThemes?: Theme[]; 
  favoriteThemes?: string[]; // Theme Names
  showGuide:boolean; // Guided Tour on/off
  showTooltips:boolean; // Form Tooltips on/off
  metaphor:string; // Prefer Cards || Tables || Auto (gui decides based on data array length)
}

@Injectable()
export class PreferencesService {
  //public coreEvents: Subject<CoreEvent>;
  public preferences: UserPreferences = {
    "platform":"freenas",
    "timestamp":new Date(),
    "userTheme":"ix-blue", // Theme name
    "favoriteThemes": [], // Theme Names
    "showGuide":true,
    "showTooltips":true,
    "metaphor":"auto"
  }
  constructor(protected core: CoreService, protected themeService: ThemeService,private api:ApiService) {
    console.log("*** New Instance of Preferences Service ***");

    this.core.register({observerClass:this, eventName:"Authenticated",sender:this.api}).subscribe((evt:CoreEvent) => {
      console.log(evt.data);
      if(evt.data){
        this.core.emit({name:"UserDataRequest", data: [[["id", "=", "1" ]]] });
      }
    });

    this.core.register({observerClass:this, eventName:"UserData", sender:this.api }).subscribe((evt:CoreEvent) => {
      console.log(evt);
      if(evt.data[0].attributes.preferences){
        this.updatePreferences(evt.data[0].attributes.preferences);
      } else if(!evt.data[0].attributes.preferences){
        this.savePreferences();
        console.warn("No Preferences Found in Middleware");
      }
    });

    this.core.register({observerClass:this, eventName:"ChangeThemePreference",sender:this.themeService}).subscribe((evt:CoreEvent) => {
      console.log(evt.data);
      
        this.preferences.userTheme = evt.data;
        console.log(this.preferences);
        this.core.emit({name:"UserDataUpdate", data:this.preferences  });
      
    });
  }

  // Update local cache
  updatePreferences(data:UserPreferences){
    console.log("UPDATING LOCAL PREFERENCES");
    this.preferences = data;

    //Notify Guided Tour & Theme Service
    this.core.emit({name:"UserPreferencesChanged", data:this.preferences});
  }

  // Save to middleware
  savePreferences(data?:UserPreferences){
    console.log(data);
    if(!data){
      data = this.preferences;
    }
    this.core.emit({name:"UserDataUpdate", data:data});
  }

}
