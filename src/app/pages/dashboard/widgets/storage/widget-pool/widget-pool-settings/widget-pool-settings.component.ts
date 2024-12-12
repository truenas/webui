import {
  ChangeDetectionStrategy, Component, effect, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
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
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    TranslateModule,
  ],
})
export class WidgetPoolSettingsComponent implements WidgetSettingsComponent<WidgetPoolSettings>, OnInit {
  form = this.fb.group({
    poolId: [null as string, [Validators.required]],
  });

  protected poolOptions$ = this.resources.pools$.pipe(
    map((pools) => pools.map((pool) => ({ label: pool.name, value: pool.id.toString() }))),
  );

  private firstOption = toSignal(this.poolOptions$.pipe(map((opts) => opts[0]?.value)));

  private readonly formFieldNames = ['poolId'];
  constructor(
    public widgetSettingsRef: WidgetSettingsRef<WidgetPoolSettings>,
    private fb: FormBuilder,
    private resources: WidgetResourcesService,
  ) {
    effect(() => {
      const firstOption = this.firstOption();
      if (!this.widgetSettingsRef.getSettings()?.poolId && firstOption) {
        this.form.controls.poolId.setValue(firstOption);
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
    this.form.controls.poolId.setValue(settings.poolId);
  }

  private setupSettingsUpdate(): void {
    this.widgetSettingsRef.updateValidity(
      getAllFormErrors(this.form, this.formFieldNames),
    );
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (settings) => {
        this.widgetSettingsRef.updateSettings({ poolId: settings.poolId });
        this.widgetSettingsRef.updateValidity(
          getAllFormErrors(this.form, this.formFieldNames),
        );
      },
    });
  }
}
