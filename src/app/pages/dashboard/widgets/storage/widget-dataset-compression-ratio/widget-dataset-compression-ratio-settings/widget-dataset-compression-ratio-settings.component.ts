import {
  ChangeDetectionStrategy, Component, DestroyRef, effect, inject, OnInit,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { getAllFormErrors } from 'app/modules/forms/ix-forms/utils/get-form-errors.utils';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetSettingsComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import {
  WidgetDatasetCompressionRatioSettings,
} from 'app/pages/dashboard/widgets/storage/widget-dataset-compression-ratio/widget-dataset-compression-ratio.definition';

@Component({
  selector: 'ix-widget-dataset-compression-ratio-settings',
  templateUrl: './widget-dataset-compression-ratio-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    TranslateModule,
  ],
})
export class WidgetDatasetCompressionRatioSettingsComponent
implements WidgetSettingsComponent<WidgetDatasetCompressionRatioSettings>, OnInit {
  widgetSettingsRef = inject<WidgetSettingsRef<WidgetDatasetCompressionRatioSettings>>(WidgetSettingsRef);
  private fb = inject(FormBuilder);
  private resources = inject(WidgetResourcesService);
  private destroyRef = inject(DestroyRef);

  form = this.fb.nonNullable.group({
    datasetId: [null as string | null, [Validators.required]],
  });

  protected datasetOptions$ = this.resources.datasets$.pipe(
    map((datasets) => datasets.map((dataset) => ({
      label: ignoreTranslation(dataset.id),
      value: dataset.id,
    }))),
  );

  private firstOption = toSignal(this.datasetOptions$.pipe(map((opts) => opts[0]?.value)));

  private readonly formFieldNames = ['datasetId'];

  constructor() {
    effect(() => {
      const firstOption = this.firstOption();
      if (!this.widgetSettingsRef.getSettings()?.datasetId && firstOption) {
        this.form.controls.datasetId.setValue(firstOption);
      }
    });
  }

  ngOnInit(): void {
    this.setupSettingsUpdate();
    this.setCurrentSettings();
  }

  private setCurrentSettings(): void {
    const settings = this.widgetSettingsRef.getSettings();
    if (!settings) return;
    this.form.controls.datasetId.setValue(settings.datasetId);
  }

  private setupSettingsUpdate(): void {
    this.widgetSettingsRef.updateValidity(
      getAllFormErrors(this.form, this.formFieldNames),
    );
    this.form.valueChanges
      .pipe(
        map((settings) => settings.datasetId),
        filter<string>((datasetId) => !!datasetId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (datasetId) => {
          this.widgetSettingsRef.updateSettings({ datasetId });
          this.widgetSettingsRef.updateValidity(
            getAllFormErrors(this.form, this.formFieldNames),
          );
        },
      });
  }
}
