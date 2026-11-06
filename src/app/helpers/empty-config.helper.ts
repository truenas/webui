import { type IconLibraryType } from '@truenas/ui-components';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

/**
 * The `[icon]` / `[iconLibrary]` / `[iconSize]` triplet a `tn-empty` binds.
 * `size` is `undefined` unless the config is `large`. Binding that `undefined`
 * straight through is safe rather than an override of the component's own
 * preset: `tn-empty` forwards `iconSize` to `tn-icon`'s `customSize`, which
 * resolves as `customSize() || null` and so falls back to the `size`-based
 * preset.
 */
export interface EmptyStateIcon {
  name: string | undefined;
  library: IconLibraryType;
  size: string | undefined;
}

/**
 * Icon size the pre-migration `<ix-empty>` rendered a `large: true` config at.
 * `tn-empty`'s presets are smaller, so a large empty state overrides them.
 */
const largeEmptyIconSize = '56px';

/**
 * Splits a `tnIconMarker` string (`mdi-cloud-outline`, `app-replication`) into the bare name and
 * library that `tn-empty` takes. The catalog stores markers because they pull icons into the sprite;
 * this keeps templates from copying both halves by hand. Unprefixed names report `mdi`, `tn-empty`'s default.
 */
export function splitIconMarker(marker: string | undefined): { name: string | undefined; library: IconLibraryType } {
  if (marker?.startsWith('app-')) {
    return { name: marker.slice('app-'.length), library: 'custom' };
  }
  if (marker?.startsWith('mat-')) {
    return { name: marker.slice('mat-'.length), library: 'material' };
  }
  if (marker?.startsWith('mdi-')) {
    return { name: marker.slice('mdi-'.length), library: 'mdi' };
  }
  return { name: marker || undefined, library: 'mdi' };
}

/**
 * Derives a `tn-empty`'s icon bindings from the `EmptyConfig` that already owns
 * its message, so the catalog stays the single source of truth for both.
 *
 * `markerOverride` covers the states whose icon comes from the empty *type*
 * rather than the page (`EmptyService.iconForType`, e.g. no-search-results),
 * where the config itself carries no icon.
 */
export function emptyConfigIcon(config: EmptyConfig, markerOverride?: string): EmptyStateIcon {
  return {
    ...splitIconMarker(markerOverride || config.icon),
    size: config.large ? largeEmptyIconSize : undefined,
  };
}
