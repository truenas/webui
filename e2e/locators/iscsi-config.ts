/**
 * The full iSCSI page's Portals, Initiators and Authorized Access tabs, their
 * forms, and the Global Target Configuration panel its header opens.
 *
 * Derived from the templates rather than read off a running appliance; see
 * `signin.ts` for the type-prefixing that produces these values.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/** The tabs of the full iSCSI page this module drives, by the slug in `iscsi.component.ts`. */
export type IscsiConfigTab = 'portals' | 'initiators' | 'authorized-access';

/**
 * Row tags, built with `toUniqueRowTag`, which runs the whole tag through lodash
 * (`e2e` becomes `e-2-e`). A portal's is keyed by its comment, an initiator
 * group's by its id, and an authorized access entry's by its user and peer user.
 */
const portalRowTag = (comment: string): string => legacyKebabTestSegment(`iscsi-portal-${comment}`);
const initiatorRowTag = (id: number): string => legacyKebabTestSegment(`iscsi-initiator-${id}`);
const authRowTag = (user: string, peeruser: string): string => (
  legacyKebabTestSegment(`iscsi-authorized-access-${user}-${peeruser}`)
);

/**
 * A row, and the Edit and Delete behind its action menu. None of these lists asks
 * for `mode="inline"`, so both collapse behind the trigger, and each one's id is
 * the trigger's with the icon appended, library and all.
 */
export interface IscsiRowLocators {
  row: string;
  menu: string;
  edit: string;
  delete: string;
}

function rowLocators(tag: string): IscsiRowLocators {
  const base = `button-${kebabTestSegment(tag)}-more-action`;
  return {
    row: `[data-test="row-${kebabTestSegment(tag)}"]`,
    menu: `[data-test="${base}"]`,
    edit: `[data-test="${base}-mdi-pencil-row-action"]`,
    delete: `[data-test="${base}-mdi-delete-row-action"]`,
  };
}

export const iscsiConfigLocators = {
  /**
   * The Block (iSCSI) Shares Targets card's title, a link to the full iSCSI page
   * on its Targets tab — `tnTestIdType="link"` with `['iscsi-share', 'open-in-new']`.
   */
  openPage: '[data-test="link-iscsi-share-open-in-new"]',

  /** `tn-tab` emits `tab-<slug>`. */
  tab: (slug: IscsiConfigTab): string => `[data-test="tab-${slug}"]`,

  /** "Global Target Configuration" in the page header. Opens a side panel. */
  globalConfiguration: '[data-test="button-global-target-configuration"]',

  portals: {
    add: '[data-test="button-add-portal"]',
    row: (comment: string): IscsiRowLocators => rowLocators(portalRowTag(comment)),
    /** The Description cell, which shows the portal's `comment`. */
    description: (comment: string): string => `[data-test="text-description-${portalRowTag(comment)}-row-text"]`,
  },

  /** The Add/Edit portal form, in the side panel. */
  portalForm: {
    /** "Description". The control is `comment`. */
    comment: '[data-test="input-comment"]',
    /** "Add" under the listen list, whose label is "Add listen" — not the wizard's "IP Address". */
    addListen: '[data-test="button-add-item-add-listen"]',
    /**
     * A listen address, by its position. Bound with `[formControlName]="i"` and no
     * `testId`, so its base is the index, and its options are keyed by their label,
     * which is the address.
     */
    listen: (index: number): string => `[data-test="select-${index}"]`,
    listenOption: (index: number, address: string): string => (
      `[data-test="option-${index}-${kebabTestSegment(address)}"]`
    ),
    save: '[data-test="button-save"]',
  },

  initiators: {
    /** Navigates to the routed add page, `/sharing/iscsi/initiators/add`. */
    add: '[data-test="button-add-initiator"]',
    row: (id: number): IscsiRowLocators => rowLocators(initiatorRowTag(id)),
    description: (id: number): string => `[data-test="text-description-${initiatorRowTag(id)}-row-text"]`,
  },

  /** The routed Add/Edit initiator group page — a card, not a side panel. */
  initiatorForm: {
    /**
     * "Add Allowed Initiators (IQN)". Rendered only while "Allow All Initiators"
     * is off, so its appearing is also that check.
     */
    newInitiator: '[data-test="input-new-initiator"]',
    /**
     * The plus button beside it, which moves the typed IQN into Allowed
     * Initiators. The same id as the list's Add; the two are on different routes.
     */
    addInitiator: '[data-test="button-add-initiator"]',
    comment: '[data-test="input-comment"]',
    /** In the card's footer. */
    save: '[data-test="button-save"]',
  },

  authorizedAccess: {
    /**
     * "Add". `add-target-extent` is a historical misnomer, frozen in
     * `authorized-access-list.component.html` because a `data-test` is a Release
     * Engineering contract.
     */
    add: '[data-test="button-add-target-extent"]',
    /** Keyed by user and peer user; pass `''` for an entry with no peer. */
    row: (user: string, peeruser: string): IscsiRowLocators => rowLocators(authRowTag(user, peeruser)),
    userCell: (user: string, peeruser: string): string => (
      `[data-test="text-user-${authRowTag(user, peeruser)}-row-text"]`
    ),
  },

  /** The Add/Edit authorized access form, rendered from a config with `[testId]="field.name"`. */
  authorizedAccessForm: {
    /** "Group ID". */
    tag: '[data-test="input-tag"]',
    discoveryAuth: '[data-test="select-discovery-auth"]',
    discoveryAuthChap: '[data-test="option-discovery-auth-chap"]',
    discoveryAuthMutualChap: '[data-test="option-discovery-auth-mutual-chap"]',
    user: '[data-test="input-user"]',
    secret: '[data-test="input-secret"]',
    /** The `tn-form-field` around {@link secret}, which the renderer tags by field name: its label and its error. */
    secretField: '[data-test="form-field-secret"]',
    secretConfirm: '[data-test="input-secret-confirm"]',
    /** The peer fields are shown only while Discovery Authentication is Mutual CHAP. */
    peeruser: '[data-test="input-peeruser"]',
    peersecret: '[data-test="input-peersecret"]',
    peersecretConfirm: '[data-test="input-peersecret-confirm"]',
    save: '[data-test="button-save"]',
  },

  /** The Global Target Configuration side panel. */
  globalConfigurationForm: {
    basename: '[data-test="input-basename"]',
    /** A `tn-chip-input`: type an address, and Enter commits it as a chip. */
    isnsServers: '[data-test="chip-input-isns-servers"]',
    poolAvailThreshold: '[data-test="input-pool-avail-threshold"]',
    listenPort: '[data-test="input-listen-port"]',
    save: '[data-test="button-save"]',
  },
} as const;
