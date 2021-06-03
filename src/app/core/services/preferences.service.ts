import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CoreEvent } from 'app/interfaces/events';
import { CoreService } from './core.service';
import { ApiService } from './api.service';
import { ThemeService, Theme } from 'app/services/theme/theme.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

interface PropertyReport {
  middlewareProperties: string[];
  serviceProperties: string[];
  deprecatedProperties: string[];
  newProperties: string[];
}

export interface UserPreferences {
  platform?: string; // FreeNAS || TrueNAS
  retroLogo?: boolean; // Brings back FreeNAS branding
  timestamp?: Date;
  userTheme?: string; // Theme name
  customThemes?: Theme[];
  favoriteThemes?: string[]; // Deprecate
  showGuide?: boolean; // Guided Tour on/off
  showTooltips?: boolean; // Form Tooltips on/off // Deprecated, remove in v12!
  metaphor?: string; // Prefer Cards || Tables || Auto (gui decides based on data array length)
  allowPwToggle?: boolean;
  preferIconsOnly?: boolean;
  rebootAfterManualUpdate?: boolean;
  tableDisplayedColumns?: any;
  hide_builtin_users?: boolean;
  hide_builtin_groups?: boolean;
  dateFormat?: string;
  timeFormat?: string;
  showWelcomeDialog?: boolean;
  showUserListMessage?: boolean;
  showGroupListMessage?: boolean;
  expandAvailablePlugins?: boolean;
  storedValues?: any;
}

@UntilDestroy()
@Injectable()
export class PreferencesService {
  private startupComplete = false;
  defaultPreferences: UserPreferences = {
    platform: 'freenas', // Detect platform
    retroLogo: false,
    timestamp: new Date(),
    userTheme: 'default', // Theme name
    customThemes: [], // Theme Objects
    favoriteThemes: [], // Theme Names
    showGuide: true,
    showTooltips: true,
    metaphor: 'auto',
    allowPwToggle: true,
    preferIconsOnly: false,
    rebootAfterManualUpdate: false,
    tableDisplayedColumns: [],
    hide_builtin_users: true,
    hide_builtin_groups: true,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    showWelcomeDialog: true,
    showUserListMessage: true,
    showGroupListMessage: true,
    expandAvailablePlugins: true,
    storedValues: {}, // For key/value pairs to save most recent values in form fields, etc
  };

  preferences: UserPreferences;

  constructor(protected core: CoreService, protected themeService: ThemeService, private api: ApiService, private router: Router,
    private aroute: ActivatedRoute) {
    this.preferences = this.defaultPreferences;

    this.core.register({ observerClass: this, eventName: 'Authenticated', sender: this.api }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      // evt.data: boolean represents authentication status
      if (evt.data) {
        this.core.emit({ name: 'UserDataRequest', data: [[['id', '=', 1]]] });
      }
    });

    this.core.register({ observerClass: this, eventName: 'UserPreferencesRequest' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      // Ignore requests until we have UserData
      if (!this.startupComplete) { return; }

      if (!evt.data) {
        this.core.emit({ name: 'UserDataRequest', data: [[['id', '=', 1]]] });
      }
    });

    this.core.register({ observerClass: this, eventName: 'UserData', sender: this.api }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data[0]) {
        const data = evt.data[0].attributes.preferences;
        if (!data) {
          // If preferences do not exist return after saving Preferences so that UI can retry.
          this.savePreferences();
          console.warn('No Preferences Found in Middleware');
          return;
        }

        this.updatePreferences(data);
      }

      if (!this.startupComplete) {
        this.core.emit({ name: 'UserPreferencesReady', data: this.preferences, sender: this });
        this.startupComplete = true;
      }
    });

    this.core.register({ observerClass: this, eventName: 'ChangeThemePreference', sender: this.themeService }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      this.preferences.userTheme = evt.data;
      this.core.emit({ name: 'UserDataUpdate', data: this.preferences });
    });

    this.core.register({ observerClass: this, eventName: 'ChangeCustomThemesPreference' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      this.preferences.customThemes = evt.data;
      this.core.emit({ name: 'UserDataUpdate', data: this.preferences });
    });

    this.core.register({ observerClass: this, eventName: 'ReplaceCustomThemePreference' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      let oldTheme: Theme;
      const newTheme = evt.data;
      const replaced: boolean = this.replaceCustomTheme(oldTheme, newTheme);
      if (replaced) {
        this.core.emit({ name: 'UserDataUpdate', data: this.preferences });
      }
    });

    // Reset the entire preferences object to default
    this.core.register({ observerClass: this, eventName: 'ResetPreferences' }).pipe(untilDestroyed(this)).subscribe(() => {
      const prefs = Object.assign(this.defaultPreferences, {});
      prefs.customThemes = this.preferences.customThemes;
      prefs.timestamp = new Date();
      this.savePreferences(prefs);
    });

    // Change the entire preferences object at once
    this.core.register({ observerClass: this, eventName: 'ChangePreferences' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      const prefs: any = this.preferences;
      Object.keys(evt.data).forEach((key) => {
        prefs[key] = evt.data[key];
      });
      this.setShowGuide(evt.data.showGuide);
      this.preferences.timestamp = new Date();
      this.savePreferences(this.preferences);
    });

    // Change a single preference item
    this.core.register({ observerClass: this, eventName: 'ChangePreference' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      const prefs: any = Object.assign(this.preferences, {});
      prefs[evt.data.key] = evt.data.value;
      prefs.timestamp = new Date();
      this.preferences = prefs;
      this.setShowGuide(evt.data.showGuide);
      this.savePreferences(this.preferences);
    });
  }

  // Update local cache
  updatePreferences(data: UserPreferences): void {
    if (data && !this.startupComplete) {
      console.warn('Startup is not complete!');
      console.warn(data);
      this.sanityCheck(data);
    }

    const clone: any = {};
    const keys = Object.keys(this.preferences) as (keyof PreferencesService['preferences'])[];
    keys.forEach((key) => {
      if (data[key] !== undefined) {
        // If middleware object contains a valid key, store the value
        clone[key] = data[key];
      } else {
        // Otherwise use the locally stored value
        clone[key] = this.preferences[key];
      }
    });
    this.preferences = clone;

    if (this.startupComplete) {
      this.core.emit({ name: 'UserPreferencesChanged', data: this.preferences, sender: this });
    }
  }

  // Save to middleware
  savePreferences(data?: UserPreferences): void {
    if (!data) {
      data = this.preferences;
    }
    this.core.emit({ name: 'UserDataUpdate', data });
  }

  replaceCustomTheme(oldTheme: Theme, newTheme: Theme): boolean {
    const index = this.preferences.customThemes.indexOf(oldTheme);
    if (index && index >= 0) {
      this.preferences.customThemes[index] = newTheme;
      return true;
    }
    return false;
  }

  setShowGuide(value: boolean): void {
    if (value) {
      localStorage.setItem(this.router.url, 'true');
    } else if (!value) {
      localStorage.setItem(this.router.url, 'false');
    }
  }

  sanityCheck(data: UserPreferences): PropertyReport {
    let oldKeys = [];
    let newKeys = [];

    const savedKeys = Object.keys(data);
    const currentKeys = Object.keys(this.preferences);

    // Find Deprecated
    oldKeys = savedKeys.filter((key) => currentKeys.indexOf(key) == -1);

    // Find New
    newKeys = currentKeys.filter((key) => savedKeys.indexOf(key) == -1);

    const report: PropertyReport = {
      middlewareProperties: savedKeys, // Inbound from Middleware
      serviceProperties: currentKeys, // Stored in the service
      deprecatedProperties: oldKeys, // Deprecated
      newProperties: newKeys, // New Keys
    };

    return report;
  }
}
