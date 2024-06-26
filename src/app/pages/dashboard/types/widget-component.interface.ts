import { InputSignal, Type } from '@angular/core';
import { Observable } from 'rxjs';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import {
  SomeWidgetSettings, SlotSize,
} from 'app/pages/dashboard/types/widget.interface';

export interface WidgetComponentWithSettings<Settings extends SomeWidgetSettings> {
  size: InputSignal<SlotSize>;
  settings: InputSignal<Settings>;
}

export interface WidgetComponentWithoutSettings {
  size: InputSignal<SlotSize>;
}

export type WidgetComponent<Settings extends SomeWidgetSettings = null> =
  Settings extends null
    ? WidgetComponentWithoutSettings
    : WidgetComponentWithSettings<Settings>;

export interface WidgetSettingsComponent<Settings extends SomeWidgetSettings = null> {
  widgetSettingsRef: WidgetSettingsRef<Settings>;
}

type WidgetSettingsComponentType<Settings> = Settings extends SomeWidgetSettings
  ? WidgetSettingsComponent<Settings>
  : null;

export type WidgetVisibilityDepsType<T = unknown> = Map<Type<T>, T>;

export interface WidgetDefinition<
  Settings extends SomeWidgetSettings | null,
  Component extends WidgetComponent<Settings>,
  SettingsComponent extends WidgetSettingsComponentType<Settings>,
  WidgetVisibilityProvider = unknown,
> {
  name: string;
  supportedSizes: SlotSize[];
  category: WidgetCategory;
  component: Type<Component>;
  settingsComponent: SettingsComponent extends null ? null : Type<SettingsComponent>;
  visibility?: {
    deps: Type<WidgetVisibilityProvider>[];
    isVisible$: (deps: WidgetVisibilityDepsType<WidgetVisibilityProvider>) => Observable<boolean>;
  };
}

/**
 * If your widget defines custom settings, supply settings in first generic argument.
 * ```
 * export const ipv4AddressWidget = dashboardWidget<WidgetInterfaceIpSettings>({
 *   name: T('IPv4 Datapoint'),
 *   component: WidgetInterfaceIpComponent,
 *   category: WidgetCategory.Network,
 *   settingsComponent: WidgetInterfaceIpSettingsComponent,
 *   supportedSizes: [SlotSize.Full, SlotSize.Half, SlotSize.Quarter],
 *   visibility: {
 *     deps: [Store],
 *     isVisible$: (deps) => deps.get(Store).select(selectIsHaLicensed),
 *   },
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
