import {
  ChangeDetectionStrategy, Component, effect, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { getAllFormErrors } from 'app/modules/forms/ix-forms/utils/get-form-errors.utils';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetSettingsComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import {
  WidgetInterfaceIpSettings,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';

@UntilDestroy()
@Component({
  selector: 'ix-widget-interface-ip-settings',
  templateUrl: './widget-interface-ip-settings.component.html',
  styleUrl: './widget-interface-ip-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    TranslateModule,
  ],
})
export class WidgetInterfaceIpSettingsComponent implements WidgetSettingsComponent<WidgetInterfaceIpSettings>, OnInit {
  form = this.fb.group({
    interface: [null as string, [Validators.required]],
  });

  protected networkInterfaceOptions$ = this.resources.networkInterfaces$.pipe(
    filter((state) => !!state.value && !state.isLoading),
    map((state) => state.value),
    startWith([]),
    idNameArrayToOptions(),
  );

  private firstOption = toSignal(this.networkInterfaceOptions$.pipe(map((opts) => opts[0]?.value)));

  private readonly formFieldNames = ['interface'];
  constructor(
    public widgetSettingsRef: WidgetSettingsRef<WidgetInterfaceIpSettings>,
    private fb: FormBuilder,
    private resources: WidgetResourcesService,
  ) {
    effect(() => {
      const firstOption = this.firstOption();
      if (!this.widgetSettingsRef.getSettings()?.interface && firstOption) {
        this.form.controls.interface.setValue(firstOption);
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
    this.form.controls.interface.setValue(settings.interface);
  }

  private setupSettingsUpdate(): void {
    this.widgetSettingsRef.updateValidity(
      getAllFormErrors(this.form, this.formFieldNames),
    );
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (settings) => {
        this.widgetSettingsRef.updateSettings({ interface: settings.interface });
        this.widgetSettingsRef.updateValidity(
          getAllFormErrors(this.form, this.formFieldNames),
        );
      },
    });
  }
}
