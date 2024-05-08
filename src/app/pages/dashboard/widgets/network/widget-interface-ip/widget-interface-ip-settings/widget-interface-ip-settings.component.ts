import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WidgetSettingsComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import {
  WidgetInterfaceIpSettings,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';

@UntilDestroy()
@Component({
  selector: 'ix-widget-interface-ip-settings',
  templateUrl: './widget-interface-ip-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetInterfaceIpSettingsComponent implements WidgetSettingsComponent<WidgetInterfaceIpSettings>, OnInit {
  form = this.fb.group({
    interfaceIp: [null as string, [Validators.required]],
    name: [''],
  });

  private readonly formFieldNames = ['interfaceIp'];
  constructor(
    public widgetSettingsRef: WidgetSettingsRef<WidgetInterfaceIpSettings>,
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
    this.form.controls.interfaceIp.setValue(settings.interface);
  }

  private setupSettingsUpdate(): void {
    this.widgetSettingsRef.updateValidity(
      this.widgetSettingsRef.getAllFormErrors(this.form, this.formFieldNames),
    );
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (settings) => {
        this.widgetSettingsRef.updateSettings({ interface: settings.interfaceIp });
        this.widgetSettingsRef.updateValidity(
          this.widgetSettingsRef.getAllFormErrors(this.form, this.formFieldNames),
        );
      },
    });
  }
}
