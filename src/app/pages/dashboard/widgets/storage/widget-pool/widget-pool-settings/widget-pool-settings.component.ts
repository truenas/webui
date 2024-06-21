import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs';
import { getAllFormErrors } from 'app/modules/forms/ix-forms/utils/get-form-errors.utils';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetSettingsComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import { WidgetPoolSettings } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.definition';

@UntilDestroy()
@Component({
  selector: 'ix-widget-pool-settings',
  templateUrl: './widget-pool-settings.component.html',
  styleUrl: './widget-pool-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetPoolSettingsComponent implements WidgetSettingsComponent<WidgetPoolSettings>, OnInit {
  form = this.fb.group({
    pool: [null as string, [Validators.required]],
  });

  protected poolOptions$ = this.resources.pools$.pipe(
    map((pools) => pools.map((result) => ({
      label: result.name,
      value: result.id,
    }))),
  );

  private readonly formFieldNames = ['pool'];
  constructor(
    public widgetSettingsRef: WidgetSettingsRef<WidgetPoolSettings>,
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
    this.form.controls.pool.setValue(settings.poolId);
  }

  private setupSettingsUpdate(): void {
    this.widgetSettingsRef.updateValidity(
      getAllFormErrors(this.form, this.formFieldNames),
    );
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (settings) => {
        this.widgetSettingsRef.updateSettings({ poolId: settings.pool });
        this.widgetSettingsRef.updateValidity(
          getAllFormErrors(this.form, this.formFieldNames),
        );
      },
    });
  }
}
