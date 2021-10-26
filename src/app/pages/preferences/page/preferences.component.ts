import {
  Component, OnDestroy, OnInit, ViewChild,
} from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CoreService } from 'app/core/services/core-service/core.service';
import { CoreEvent } from 'app/interfaces/events';
import { Option } from 'app/interfaces/option.interface';
import {
  EmbeddedFormConfig,
  EntityFormEmbeddedComponent,
} from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { UserPreferences } from 'app/pages/preferences/page/preferences.types';
import { DefaultTheme, ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
})
export class PreferencesPageComponent implements EmbeddedFormConfig, OnInit, OnDestroy {
  @ViewChild('embeddedForm', { static: false }) embeddedForm: EntityFormEmbeddedComponent;
  target: Subject<CoreEvent> = new Subject();
  isWaiting = false;
  values: any[] = [];
  preferences: UserPreferences;
  saveSubmitText = T('Update Preferences');
  multiStateSubmit = true;
  isEntity = true;
  private themeOptions: Option[] = [];
  fieldConfig: FieldConfig[] = [];
  fieldSetDisplay = 'no-margins';// default | carousel | stepper
  fieldSets: FieldSet[] = [
    {
      name: T('General Preferences'),
      class: 'preferences',
      label: true,
      config: [],
    },
  ];

  constructor(
    private themeService: ThemeService,
    private core: CoreService,
  ) {}

  ngOnInit(): void {
    this.core.emit({ name: 'UserPreferencesRequest', sender: this });
    this.core.register({ observerClass: this, eventName: 'UserPreferencesChanged' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (this.isWaiting) {
        this.target.next({ name: 'SubmitComplete', sender: this });
        this.isWaiting = false;
      }

      this.preferences = evt.data;
      this.onPreferences(evt.data);
      this.init(true);
    });

    this.core.register({ observerClass: this, eventName: 'UserPreferencesReady' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (this.isWaiting) {
        this.target.next({ name: 'SubmitComplete', sender: this });
        this.isWaiting = false;
      }
      this.preferences = evt.data;
      this.onPreferences(evt.data);
      this.init(true);
    });

    this.init();
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  init(updating?: boolean): void {
    this.setThemeOptions();
    if (!updating) {
      this.startSubscriptions();
    }
    this.generateFieldConfig();
  }

  startSubscriptions(): void {
    this.core.register({ observerClass: this, eventName: 'ThemeListsChanged' }).pipe(untilDestroyed(this)).subscribe(() => {
      this.setThemeOptions();
      if (!this.embeddedForm) { return; }

      const theme = this.preferences.userTheme;
      this.embeddedForm.setValue('userTheme', theme);
    });

    this.target.pipe(
      filter((event) => event.name === 'FormSubmitted'),
      untilDestroyed(this),
    ).subscribe((evt: CoreEvent) => {
      const prefs = Object.assign(evt.data, {});
      if (prefs.reset == true) {
        this.core.emit({ name: 'ResetPreferences', sender: this });
        this.target.next({ name: 'SubmitStart', sender: this });
        this.isWaiting = true;
        return;
      }

      // We don't store this in the backend
      delete prefs.reset;

      this.core.emit({ name: 'ChangePreferences', data: prefs });
      this.target.next({ name: 'SubmitStart', sender: this });
      this.isWaiting = true;
    });
  }

  setThemeOptions(): void {
    this.themeOptions.splice(0, this.themeOptions.length);
    this.themeService.allThemes.forEach((theme) => {
      this.themeOptions.push({ label: theme.label, value: theme.name });
    });
  }

  onPreferences(prefs: any): void {
    this.fieldSets[0].config = [
      {
        type: 'select',
        name: 'userTheme',
        placeholder: T('Choose Theme'),
        options: this.themeOptions,
        value: prefs.userTheme == 'default' ? DefaultTheme.name : prefs.userTheme,
        tooltip: T('Choose a preferred theme.'),
        class: 'inline',
      },
      {
        type: 'checkbox',
        name: 'preferIconsOnly',
        placeholder: T('Prefer buttons with icons only'),
        value: prefs.preferIconsOnly,
        tooltip: T('Preserve screen space with icons and tooltips instead of text labels.'),
        class: 'inline',
      },
      {
        type: 'checkbox',
        name: 'allowPwToggle',
        placeholder: T('Enable Password Toggle'),
        value: prefs.allowPwToggle,
        tooltip: T(
          'When set, an <i>eye</i> icon appears next to password fields. Clicking the icon reveals the password.',
        ),
        class: 'inline',
      },
      {
        type: 'checkbox',
        name: 'tableDisplayedColumns',
        placeholder: T('Reset Table Columns to Default'),
        value: false,
        tooltip: T('Reset all tables to display default columns.'),
        class: 'inline',
      },
      {
        type: 'checkbox',
        name: 'retroLogo',
        placeholder: T('Retro Logo'),
        value: prefs.retroLogo,
        tooltip: T('Revert branding back to FreeNAS'),
        class: 'inline',
      },
      {
        type: 'checkbox',
        name: 'reset',
        placeholder: T('Reset All Preferences to Default'),
        value: false,
        tooltip: T('Reset all user preferences to their default values. (Custom themes are preserved)'),
        class: 'inline',
      },
    ];

    if (this.embeddedForm) {
      this.updateValues(prefs);
    }
  }

  generateFieldConfig(): void {
    this.fieldSets.forEach((fieldSet) => {
      fieldSet.config.forEach((config) => {
        this.fieldConfig.push(config);
      });
    });
  }

  beforeSubmit(data: any): void {
    if (data.reset) {
      localStorage.removeItem('turnOffWelcomeDialog');
    }
    if (data.tableDisplayedColumns) {
      data.tableDisplayedColumns = [];
    } else {
      delete (data.tableDisplayedColumns);
    }
  }

  updateValues(prefs: any): void {
    const keys = Object.keys(this.embeddedForm.formGroup.controls);
    keys.forEach((key) => {
      if (key !== 'reset') {
        if (key == 'userTheme' && prefs[key] == 'default') {
          this.embeddedForm.formGroup.controls[key].setValue(DefaultTheme.name);
        } else {
          this.embeddedForm.formGroup.controls[key].setValue(prefs[key]);
        }
      }
    });

    // We don't store this value in middleware so we set it manually
    this.embeddedForm.formGroup.controls['reset'].setValue(false);
  }
}
