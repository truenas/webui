/**
 * The Static Routes card on System > Network, its form and its delete dialog. Row ids come from `uniqueRowTag`,
 * `static-route-<destination>-<gateway>`, via `convertStringToId` then the library normalizer, which agree on
 * addresses, so use {@link kebabTestSegment} (`static-route-198-51-100-0-26-192-0-2-21`). Changing the gateway
 * renames every id on the row; look it up again. `mode="inline"` makes Edit and Delete row icon buttons with no
 * `more-action`. The form is `ix-form-renderer` from `static-route.form-config.ts`, so ids are control names.
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

    /**
     * The card's pager, `<ix-table-pager-show-more [testId]="['static-routes']">`.
     * View All renders only while there are more routes than the card lists, and
     * Collapse only once it was pressed. It has no `routerLink`, so it expands in place.
     */
    viewAll: '[data-test="button-static-routes-show-more"]',
    collapse: '[data-test="button-static-routes-show-less"]',

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
