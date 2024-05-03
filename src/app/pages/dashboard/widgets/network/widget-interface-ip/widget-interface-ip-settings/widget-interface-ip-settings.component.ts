import {
  ChangeDetectionStrategy, Component, OnInit, input,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WidgetGroupFormStore } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.store';
import { WidgetSettingsComponent } from 'app/pages/dashboard/types/widget-component.interface';
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
  something: WidgetInterfaceIpSettings;
  slotIndex = input.required<number>();
  readonly interfaceIp = new FormControl(null as string, [Validators.required]);

  constructor(
    private widgetGroupFormStore: WidgetGroupFormStore,
  ) {}

  ngOnInit(): void {
    this.interfaceIp.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (interfaceIp) => {
        this.widgetGroupFormStore.setSettings({
          slotIndex: this.slotIndex(),
          settings: {
            interface: interfaceIp,
          } as WidgetInterfaceIpSettings,
        });
      },
    });
  }
}
