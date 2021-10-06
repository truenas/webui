import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CoreEvent } from 'app/interfaces/events';
import { AuthenticatedEvent } from 'app/interfaces/events/authenticated-event.interface';
import { ChangeThemePreferenceEvent } from 'app/interfaces/events/theme-events.interface';
import { UserDataEvent } from 'app/interfaces/events/user-data-event.interface';
import { UserPreferencesRequestEvent } from 'app/interfaces/events/user-preferences-event.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { ThemeService, Theme } from 'app/services/theme/theme.service';
import { ApiService } from './api.service';
import { CoreService } from './core-service/core.service';

interface PropertyReport {
  middlewareProperties: string[];
  serviceProperties: string[];
  deprecatedProperties: string[];
  newProperties: string[];
}

@UntilDestroy()
@Injectable()
export class PreferencesService {
  private startupComplete = false;
  defaultPreferences: Preferences = {
    platform: 'freenas', // Detect platform
    retroLogo: false,
    timestamp: new Date() as any,
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

  preferences: Preferences;

  constructor(
    protected core: CoreService,
    protected themeService: ThemeService,
    private api: ApiService,
    private router: Router,
  ) {
    this.preferences = this.defaultPreferences;

    this.core.register({ observerClass: this, eventName: 'Authenticated', sender: this.api }).pipe(untilDestroyed(this)).subscribe((evt: AuthenticatedEvent) => {
      // evt.data: boolean represents authentication status
      if (evt.data) {
        this.core.emit({ name: 'UserDataRequest', data: [[['id', '=', 1]]] });
      }
    });

    this.core.register({ observerClass: this, eventName: 'UserPreferencesRequest' }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesRequestEvent) => {
      // Ignore requests until we have UserData
      if (!this.startupComplete) { return; }

      if (!evt.data) {
        this.core.emit({ name: 'UserDataRequest', data: [[['id', '=', 1]]] });
      }
    });

    this.core.register({ observerClass: this, eventName: 'UserData', sender: this.api }).pipe(untilDestroyed(this)).subscribe((evt: UserDataEvent) => {
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

    this.core.register({ observerClass: this, eventName: 'ChangeThemePreference', sender: this.themeService }).pipe(untilDestroyed(this)).subscribe((evt: ChangeThemePreferenceEvent) => {
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
      (prefs.timestamp as any) = new Date();
      this.savePreferences(prefs);
    });

    // Change the entire preferences object at once
    this.core.register({ observerClass: this, eventName: 'ChangePreferences' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      const prefs: any = this.preferences;
      Object.keys(evt.data).forEach((key) => {
        prefs[key] = evt.data[key];
      });
      this.setShowGuide(evt.data.showGuide);
      (this.preferences.timestamp as any) = new Date();
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
  updatePreferences(data: Preferences): void {
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
  savePreferences(data?: Preferences): void {
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

  sanityCheck(data: Preferences): PropertyReport {
    const savedKeys = Object.keys(data);
    const currentKeys = Object.keys(this.preferences);

    // Find Deprecated
    const oldKeys = savedKeys.filter((key) => !currentKeys.includes(key));

    // Find New
    const newKeys = currentKeys.filter((key) => !savedKeys.includes(key));

    const report: PropertyReport = {
      middlewareProperties: savedKeys, // Inbound from Middleware
      serviceProperties: currentKeys, // Stored in the service
      deprecatedProperties: oldKeys, // Deprecated
      newProperties: newKeys, // New Keys
    };

    return report;
  }
}
