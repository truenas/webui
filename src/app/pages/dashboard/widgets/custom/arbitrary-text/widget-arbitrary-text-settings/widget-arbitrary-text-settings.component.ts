import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { getAllFormErrors } from 'app/modules/ix-forms/utils/get-form-errors.utils';
import { WidgetSettingsComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import { WidgetArbitraryTextSettings } from 'app/pages/dashboard/widgets/custom/arbitrary-text/widget-arbitrary-text.definition';

@UntilDestroy()
@Component({
  selector: 'ix-widget-arbitrary-text-settings',
  templateUrl: './widget-arbitrary-text-settings.component.html',
  styleUrl: './widget-arbitrary-text-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetArbitraryTextSettingsComponent implements
  WidgetSettingsComponent<WidgetArbitraryTextSettings>, OnInit {
  form = this.fb.group({
    widgetTitle: [null as string, [Validators.required]],
    widgetText: [null as string, [Validators.required]],
  });

  private readonly formFieldNames = ['widgetTitle', 'widgetText'];
  constructor(
    public widgetSettingsRef: WidgetSettingsRef<WidgetArbitraryTextSettings>,
    private fb: FormBuilder,
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
    this.form.controls.widgetTitle.setValue(settings.widgetTitle);
    this.form.controls.widgetText.setValue(settings.widgetText);
  }

  private setupSettingsUpdate(): void {
    this.widgetSettingsRef.updateValidity(
      getAllFormErrors(this.form, this.formFieldNames),
    );
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (settings) => {
        this.widgetSettingsRef.updateSettings({ widgetText: settings.widgetText, widgetTitle: settings.widgetTitle });
        this.widgetSettingsRef.updateValidity(
          getAllFormErrors(this.form, this.formFieldNames),
        );
      },
    });
  }
}
