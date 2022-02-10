import {
  Component, OnDestroy, OnInit, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CoreEvent } from 'app/interfaces/events';
import { Option } from 'app/interfaces/option.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import {
  EmbeddedFormConfig,
  EntityFormEmbeddedComponent,
} from 'app/modules/entity/entity-form/entity-form-embedded.component';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { CoreService } from 'app/services/core-service/core.service';
import { defaultTheme } from 'app/services/theme/theme.constants';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { preferencesFormSubmitted, preferencesReset } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
})
export class PreferencesPageComponent implements EmbeddedFormConfig, OnInit, OnDestroy {
  @ViewChild('embeddedForm', { static: false }) embeddedForm: EntityFormEmbeddedComponent;
  target: Subject<CoreEvent> = new Subject();
  values: any[] = [];
  saveSubmitText = this.translate.instant('Update Preferences');
  multiStateSubmit = true;
  isEntity = true;
  isReady = false;
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
    private store$: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.store$.pipe(waitForPreferences, untilDestroyed(this)).subscribe((preferences) => {
      this.isReady = true;
      this.onPreferences(preferences);
      this.generateFieldConfig();
    });

    this.setThemeOptions();
    this.startSubscriptions();
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  startSubscriptions(): void {
    this.target.pipe(
      filter((event) => event.name === 'FormSubmitted'),
      untilDestroyed(this),
    ).subscribe((evt: CoreEvent) => {
      const prefs = Object.assign(evt.data, {});
      if (prefs.reset === true) {
        this.store$.dispatch(preferencesReset());
        this.target.next({ name: 'SubmitStart', sender: this });
        return;
      }

      // We don't store this in the backend
      delete prefs.reset;

      this.store$.dispatch(preferencesFormSubmitted({ formValues: prefs }));
      this.target.next({ name: 'SubmitStart', sender: this });
      this.target.next({ name: 'SubmitComplete', sender: this });
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
}
