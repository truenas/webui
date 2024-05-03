import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import {
  FormControl, ValidationErrors, Validators,
} from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  Observable, distinctUntilChanged, map,
} from 'rxjs';
import { WidgetSettingsDirective } from 'app/pages/dashboard/types/widget-settings.directive';
import {
  WidgetInterfaceIpSettings,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';

@UntilDestroy()
@Component({
  selector: 'ix-widget-interface-ip-settings',
  templateUrl: './widget-interface-ip-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetInterfaceIpSettingsComponent extends WidgetSettingsDirective<WidgetInterfaceIpSettings> {
  readonly interfaceIp: FormControl<string> = new FormControl<string>(null as string, [Validators.required]);

  override getFormValidationErrors(): ValidationErrors {
    this.interfaceIp.updateValueAndValidity();
    return this.interfaceIp.errors;
  }

  override getFormUpdater(): Observable<WidgetInterfaceIpSettings> {
    return this.interfaceIp.valueChanges.pipe(
      map((interfaceIp) => ({ interface: interfaceIp })),
      distinctUntilChanged(),
    );
  }

  override updateSettingsInStore(): void {
    this.widgetGroupFormStore.setSettings({
      slotIndex: this.slotIndex(),
      settings: { interface: this.interfaceIp.value },
    });
  }
}
