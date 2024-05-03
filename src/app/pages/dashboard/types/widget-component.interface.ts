import { InputSignal, Type } from '@angular/core';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetSettingsDirective } from 'app/pages/dashboard/types/widget-settings.directive';
import {
  SomeWidgetSettings, SlotSize,
} from 'app/pages/dashboard/types/widget.interface';

interface WidgetComponentWithSettings<Settings extends SomeWidgetSettings> {
  size: InputSignal<SlotSize>;
  settings: InputSignal<Settings>;
}

interface WidgetComponentWithoutSettings {
  size: InputSignal<SlotSize>;
}

export type WidgetComponent<Settings extends SomeWidgetSettings = null> =
  Settings extends null
    ? WidgetComponentWithoutSettings
    : WidgetComponentWithSettings<Settings>;

type WidgetSettingsComponentType<Settings> = Settings extends SomeWidgetSettings
  ? WidgetSettingsDirective<Settings>
  : null;

export interface WidgetDefinition<
  Settings extends SomeWidgetSettings | null,
  Component extends WidgetComponent<Settings>,
  SettingsComponent extends WidgetSettingsComponentType<Settings>,
> {
  name: string;
  supportedSizes: SlotSize[];
  category: WidgetCategory;
  component: Type<Component>;
  settingsComponent: SettingsComponent extends null ? null : Type<SettingsComponent>;
}

/**
 * If you widget defines custom settings, supply settings in first generic argument.
 * ```
 * export const interfaceIpWidget = dashboardWidget<WidgetInterfaceIpSettings>({
 *   name: T('IPv4 Datapoint'),
 *   component: WidgetInterfaceIpComponent,
 *   category: WidgetCategory.Network,
 *   settingsComponent: WidgetInterfaceIpSettingsComponent,
 *   supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
 * });
 * ```
 */
export function dashboardWidget<
  Settings extends SomeWidgetSettings | null = null,
  Component extends WidgetComponent<Settings> = WidgetComponent<Settings>,
  SettingsComponent extends WidgetSettingsComponentType<Settings> = WidgetSettingsComponentType<Settings>,
>(definition: WidgetDefinition<Settings, Component, SettingsComponent>): typeof definition {
  return definition;
}
