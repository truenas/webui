import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, map } from 'rxjs';
import { getAllFormErrors } from 'app/modules/forms/ix-forms/utils/get-form-errors.utils';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetSettingsComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import { WidgetAppSettings } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.definition';

@UntilDestroy()
@Component({
  selector: 'ix-widget-app-settings',
  templateUrl: './widget-app-settings.component.html',
  styleUrl: './widget-app-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetAppSettingsComponent implements WidgetSettingsComponent<WidgetAppSettings>, OnInit {
  form = this.fb.group({
    appName: [null as string, [Validators.required]],
  });

  protected installedApps$ = this.resources.installedApps$.pipe(
    filter((state) => !state.isLoading),
    map((state) => {
      return (state.value || []).map((result) => ({
        label: result.name,
        value: result.id,
      }));
    }),
  );

  private readonly formFieldNames = ['appName'];
  constructor(
    public widgetSettingsRef: WidgetSettingsRef<WidgetAppSettings>,
    private fb: FormBuilder,
    private resources: WidgetResourcesService,
  ) { }

  ngOnInit(): void {
    this.setCurrentSettings();
    this.setupSettingsUpdate();
  }

  private setCurrentSettings(): void {
    const settings = this.widgetSettingsRef.getSettings();
    if (!settings) {
      return;
    }
    this.form.controls.appName.setValue(settings.appName);
  }

  private setupSettingsUpdate(): void {
    this.widgetSettingsRef.updateValidity(
      getAllFormErrors(this.form, this.formFieldNames),
    );
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (settings) => {
        this.widgetSettingsRef.updateSettings({ appName: settings.appName });
        this.widgetSettingsRef.updateValidity(
          getAllFormErrors(this.form, this.formFieldNames),
        );
      },
    });
  }
}
