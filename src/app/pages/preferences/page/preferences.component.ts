import {
  Component, OnDestroy, OnInit, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CoreEvent } from 'app/interfaces/events';
import { UserPreferencesChangedEvent } from 'app/interfaces/events/user-preferences-event.interface';
import { Option } from 'app/interfaces/option.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import {
  EmbeddedFormConfig,
  EntityFormEmbeddedComponent,
} from 'app/modules/entity/entity-form/entity-form-embedded.component';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { CoreService } from 'app/services/core-service/core.service';
import { defaultTheme, ThemeService } from 'app/services/theme/theme.service';

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
  preferences: Preferences;
  saveSubmitText = this.translate.instant('Update Preferences');
  multiStateSubmit = true;
  isEntity = true;
  private themeOptions: Option[] = [];
  fieldConfig: FieldConfig[] = [];
  fieldSetDisplay = 'no-margins';// default | carousel | stepper
  fieldSets: FieldSet[] = [
    {
      name: this.translate.instant('General Preferences'),
      class: 'preferences',
      label: true,
      config: [],
    },
  ];

  constructor(
    private themeService: ThemeService,
    private core: CoreService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.core.emit({ name: 'UserPreferencesRequest', sender: this });
    this.core.register({ observerClass: this, eventName: 'UserPreferencesChanged' }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesChangedEvent) => {
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
      if (prefs.reset === true) {
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

  onPreferences(prefs: Preferences): void {
    this.fieldSets[0].config = [
      {
        type: 'select',
        name: 'userTheme',
        placeholder: this.translate.instant('Choose Theme'),
        options: this.themeOptions,
        value: prefs.userTheme === 'default' ? defaultTheme.name : prefs.userTheme,
        tooltip: this.translate.instant('Choose a preferred theme.'),
        class: 'inline',
      },
      {
        type: 'checkbox',
        name: 'preferIconsOnly',
        placeholder: this.translate.instant('Prefer buttons with icons only'),
        value: prefs.preferIconsOnly,
        tooltip: this.translate.instant('Preserve screen space with icons and tooltips instead of text labels.'),
        class: 'inline',
      },
      {
        type: 'checkbox',
        name: 'allowPwToggle',
        placeholder: this.translate.instant('Enable Password Toggle'),
        value: prefs.allowPwToggle,
        tooltip: this.translate.instant('When set, an <i>eye</i> icon appears next to password fields. Clicking the icon reveals the password.'),
        class: 'inline',
      },
      {
        type: 'checkbox',
        name: 'tableDisplayedColumns',
        placeholder: this.translate.instant('Reset Table Columns to Default'),
        value: false,
        tooltip: this.translate.instant('Reset all tables to display default columns.'),
        class: 'inline',
      },
      {
        type: 'checkbox',
        name: 'retroLogo',
        placeholder: this.translate.instant('Retro Logo'),
        value: prefs.retroLogo,
        tooltip: this.translate.instant('Revert branding back to FreeNAS'),
        class: 'inline',
      },
      {
        type: 'checkbox',
        name: 'reset',
        placeholder: this.translate.instant('Reset All Preferences to Default'),
        value: false,
        tooltip: this.translate.instant('Reset all user preferences to their default values. (Custom themes are preserved)'),
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
    if (data.tableDisplayedColumns) {
      data.tableDisplayedColumns = [];
    } else {
      delete (data.tableDisplayedColumns);
    }
  }

  updateValues(prefs: Preferences): void {
    const keys = Object.keys(this.embeddedForm.formGroup.controls);
    keys.forEach((key) => {
      if (key !== 'reset') {
        if (key === 'userTheme' && prefs[key] === 'default') {
          this.embeddedForm.formGroup.controls[key].setValue(defaultTheme.name);
        } else {
          this.embeddedForm.formGroup.controls[key].setValue(prefs[key]);
        }
      }
    });

    // We don't store this value in middleware so we set it manually
    this.embeddedForm.formGroup.controls['reset'].setValue(false);
  }
}
