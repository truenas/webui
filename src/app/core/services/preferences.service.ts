import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';
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
}

@Injectable()
export class PreferencesService {
  //public coreEvents: Subject<CoreEvent>;
  constructor(protected core: CoreService, protected theme: ThemeService,private api:ApiService) {
    console.log("*** New Instance of Preferences Service ***");
    this.core.register({observerClass:this, eventName:"UserAttributesChanged"}).subscribe((evt:CoreEvent) => {
    });
    this.core.register({observerClass:this, eventName:"Authenticated",sender:this.api}).subscribe((evt:CoreEvent) => {
      alert("Authenticated");
    });
  }
}
