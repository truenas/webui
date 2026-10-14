/**
 * The Static Routes card on System > Network, its form and its delete dialog.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `static-route-<destination>-<gateway>`, run through `convertStringToId` and
 * then the library's normalizer. The two agree on everything an address holds,
 * so {@link kebabTestSegment} is the one to use throughout: `198.51.100.0/26`
 * via `192.0.2.21` tags its row `static-route-198-51-100-0-26-192-0-2-21`.
 *
 * The tag carries the gateway, so **an edit that changes the gateway renames
 * every id on the row**. A spec that edits it looks the row up again under the
 * new value. The description is not in the tag, and the card does not show it.
 *
 * The card asks for `mode="inline"`, so Edit and Delete are icon buttons on the
 * row rather than items in a kebab menu, and their ids have no `more-action`.
 *
 * The form is built by `ix-form-renderer` from `static-route.form-config.ts`, so
 * every field's id is its control name — see `locators/groups.ts`.
 */
import { kebabTestSegment } from './test-id';

/** What the card keys a row on. */
export interface StaticRouteRowKey {
  destination: string;
  gateway: string;
}

function rowTag({ destination, gateway }: StaticRouteRowKey): string {
  return kebabTestSegment(`static-route-${destination}-${gateway}`);
}

export const staticRouteLocators = {
  card: {
    /** `<tn-button [testId]="['add-static-route']">` in the card footer. */
    add: '[data-test="button-add-static-route"]',

    row: (key: StaticRouteRowKey): string => `[data-test="row-${rowTag(key)}"]`,

    destination: (key: StaticRouteRowKey): string => `[data-test="text-destination-${rowTag(key)}-row-text"]`,

    gateway: (key: StaticRouteRowKey): string => `[data-test="text-gateway-${rowTag(key)}-row-text"]`,

    /** The row's own Edit button — the row tag, the icon, library and all, then `row-action`. */
    edit: (key: StaticRouteRowKey): string => `[data-test="button-${rowTag(key)}-mdi-pencil-row-action"]`,

    /** The row's own Delete button. Same shape as {@link edit}. */
    delete: (key: StaticRouteRowKey): string => `[data-test="button-${rowTag(key)}-mdi-delete-row-action"]`,
  },

  form: {
    /** Required. A network in CIDR form. */
    destination: '[data-test="input-destination"]',
    /** Required. An address of the same family as the destination. */
    gateway: '[data-test="input-gateway"]',
    description: '[data-test="input-description"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },

  /** `StaticRouteDeleteDialog`, the card's own dialog rather than webui's shared confirm. */
  deleteDialog: {
    /** `<tn-dialog-shell testId="static-route-delete">`. What to wait on before acting on it. */
    title: '[data-test="dialog-title-static-route-delete"]',
    confirm: '[data-test="button-delete"]',
  },
} as const;
