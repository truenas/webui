import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { ValidationErrors, Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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
export class WidgetInterfaceIpSettingsComponent implements WidgetInterfaceIpSettings, OnInit {
  // TODO: forced implementation of settings object means this interface property has to be here. But it is not needed
  interface: string;
  form = this.fb.group({
    interfaceIp: [null as string, [Validators.required]],
  });
  slot: number;

  constructor(
    private widgetSettingsRef: WidgetSettingsRef,
    private fb: FormBuilder,
  ) {
    const data = this.widgetSettingsRef.getData();
    this.slot = data.slot;
  }

  ngOnInit(): void {
    this.setCurrentSettings();
    this.setupSettingsUpdate();
  }

  private setCurrentSettings(): void {
    const settings = this.widgetSettingsRef.getData() as { slot: number; settings: WidgetInterfaceIpSettings };
    if (!settings.settings) {
      return;
    }
    this.form.controls.interfaceIp.setValue(settings.settings.interface);
  }

  private setupSettingsUpdate(): void {
    this.widgetSettingsRef.updateValidity(this.slot, this.getAllFormErrors());
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (settings) => {
        this.widgetSettingsRef.updateSettings(this.slot, { interface: settings.interfaceIp });
        this.widgetSettingsRef.updateValidity(this.slot, this.getAllFormErrors());
      },
    });
  }

  private getAllFormErrors(): Record<string, ValidationErrors> {
    let errorsByName: Record<string, ValidationErrors> = {};
    const fields = ['interfaceIp'] as const;
    for (const field of fields) {
      if (this.form.controls[field].errors) {
        errorsByName = { ...errorsByName, [field]: this.form.controls[field].errors };
      }
    }
    return errorsByName;
  }
}
