import {
  ApplicationRef, Component, Injector, OnInit, OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { CoreService } from 'app/core/services/core-service/core.service';
import { CoreEvent } from 'app/interfaces/events';
import { EmbeddedFormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { WebSocketService } from 'app/services/';
import { Theme, ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'custom-theme-manager-form',
  template: `
    <ng-container *ngIf="themeService && themeService.customThemes && themeService.customThemes.length > 0">
      <entity-form-embedded fxFlex="100" fxFlex.gt-xs="450px" [target]="target" [data]="values" [conf]="this"></entity-form-embedded>
    </ng-container>
  `,
})
export class CustomThemeManagerFormComponent implements EmbeddedFormConfig, OnInit, OnDestroy {
  /*
   //Preferences Object Structure
   platform:string; // FreeNAS || TrueNAS
   timestamp:Date;
   userTheme:string; // Theme name
   customThemes?: Theme[];
   favoriteThemes?: string[]; // Theme Names
   showTooltips:boolean; // Form Tooltips on/off
   metaphor:string; // Prefer Cards || Tables || Auto (gui decides based on data array length)

   */

  themesExist = false;
  emptyMessage: string = T('No custom themes. Click <b>Create New Theme</b> to create a new custom theme.');

  target: Subject<CoreEvent> = new Subject();
  values: boolean[] = [];
  saveSubmitText = T('Delete Selected');
  isEntity = true;
  private customThemeFields: FieldConfig[] = [];
  fieldConfig: FieldConfig[] = [];
  fieldSetDisplay = 'no-margins';// default | carousel | stepper
  fieldSets: FieldSet[] = [
    {
      name: T('Manage Custom Themes'),
      class: 'theme-manager',
      width: '100%',
      label: true,
      config: this.customThemeFields,
    },
  ];

  constructor(
    protected router: Router,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    public themeService: ThemeService,
    protected core: CoreService,
  ) {}

  ngOnInit(): void {
    this.initSubjects();
    // Only initialize if customThemes exist
    if (this.themeService.customThemes && this.themeService.customThemes.length > 0) {
      this.themesExist = true;
      this.initForm();
    }

    // Otherwise wait for change events from message bus
    this.core.register({ observerClass: this, eventName: 'ThemeListsChanged' }).pipe(untilDestroyed(this)).subscribe(() => {
      this.initForm();
    });
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  initForm(): void {
    this.loadValues('deselectAll');

    if (
      !this.customThemeFields
      || this.customThemeFields.length == 0
      || this.customThemeFields.length != this.themeService.customThemes.length
    ) {
      this.setCustomThemeFields();
    }
    if (!this.fieldConfig || this.fieldConfig.length == 0) {
      this.generateFieldConfig();
    }
  }

  initSubjects(): void {
    this.target.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      switch (evt.name) {
        case 'FormSubmitted':
          const submission: Theme[] = [];
          this.themeService.customThemes.forEach((theme) => {
            if (!evt.data[theme.name]) {
              submission.push(theme);
            }
          });
          this.core.emit({ name: 'ChangeCustomThemesPreference', data: submission });
          break;
      }
    });
  }

  loadValues(key: string): void {
    const values: boolean[] = [];

    this.themeService.customThemes.forEach((theme) => {
      switch (key) {
        case 'selectAll':
          values.push(true);
          break;
        case 'deselectAll':
          values.push(false);
          break;
        case 'favorites':
          values.push(theme.favorite);
      }
    });
    this.values = values;
  }

  setCustomThemeFields(): void {
    if (this.customThemeFields && this.customThemeFields.length > 0) {
      this.customThemeFields.splice(0, this.customThemeFields.length);
    }

    this.themeService.customThemes.forEach((theme) => {
      const field: FieldConfig = {
        type: 'checkbox',
        name: theme.name,
        width: '200px',
        placeholder: theme.label,
        tooltip: 'Delete custom theme ' + theme.label,
        class: 'inline',
      };
      this.customThemeFields.push(field);
    });
  }

  generateFieldConfig(): void {
    this.fieldConfig = this.customThemeFields;
  }
}
