import { Preferences } from 'app/interfaces/preferences.interface';

export interface UserPreferencesEvent {
  name: 'UserPreferences';
  sender: unknown;
  data: Preferences;
}

export interface UserPreferencesChangedEvent {
  name: 'UserPreferencesChanged';
  sender: unknown;
  data: Preferences;
}

export interface UserPreferencesReadyEvent {
  name: 'UserPreferencesReady';
  sender: unknown;
  data: Preferences;
}

export interface UserPreferencesRequestEvent {
  name: 'UserPreferencesRequest';
  sender: unknown;
  data: unknown;
}
