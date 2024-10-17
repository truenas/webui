import {
  ChangeDetectionStrategy, Component, effect, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
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
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    TranslateModule,
  ],
})
export class WidgetAppSettingsComponent implements WidgetSettingsComponent<WidgetAppSettings>, OnInit {
  form = this.fb.group({
    appName: [null as string, [Validators.required]],
  });

  protected installedApps$ = this.resources.installedApps$.pipe(
    startWith([]),
    idNameArrayToOptions(),
  );

  private firstOption = toSignal(this.installedApps$.pipe(map((opts) => opts[0]?.value)));

  private readonly formFieldNames = ['appName'];
  constructor(
    public widgetSettingsRef: WidgetSettingsRef<WidgetAppSettings>,
    private fb: FormBuilder,
    private resources: WidgetResourcesService,
  ) {
    effect(() => {
      const firstOption = this.firstOption();
      if (!this.widgetSettingsRef.getSettings()?.appName && firstOption) {
        this.form.controls.appName.setValue(firstOption);
      }
    });
  }

  ngOnInit(): void {
    this.setCurrentSettings();
    this.setupSettingsUpdate();
  }

  private setCurrentSettings(): void {
    const settings = this.widgetSettingsRef.getSettings();
    if (!settings) return;
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
