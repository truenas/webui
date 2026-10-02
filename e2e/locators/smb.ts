/**
 * SMB shares — the dashboard card and the share form.
 *
 * The form is hand-written (`smb-form.component.html`), so its ids come from
 * explicit `testId` inputs. Every value below was read off a running appliance,
 * because several are not what the template suggests — see {@link rowMenuDelete}.
 *
 * See `signin.ts` for a note on the type-prefixing that produces these values.
 */
import { confirmDialogLocators } from './dialogs';
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

export const smbLocators = {
  /**
   * "Add" in the Windows (SMB) Shares card on the Shares dashboard —
   * `testId="smb-share-add"` in `smb-card.component.html`.
   *
   * Not `add-smb-share`, which belongs to the standalone SMB *list* page at
   * `/sharing/smb`. Arriving via the sidebar lands on the dashboard, so the
   * card's button is the one a user actually clicks.
   */
  addShare: '[data-test="button-smb-share-add"]',

  form: {
    /**
     * The preset picker, and the most consequential control on the form:
     * `presetEnabledFields` keys off it to decide which options exist at all.
     */
    purpose: '[data-test="select-purpose"]',
    /**
     * A purpose option, by the label shown on screen — `tn-select` derives an
     * option's id from its label, not its value. The two agree for some
     * purposes and not for others: `Time Machine Share` is `time-machine-share`
     * here, while its stored value, `TIMEMACHINE_SHARE`, would give
     * `timemachine-share`.
     *
     * The picker does not offer every purpose: `Legacy Share` is left out for a
     * new share, and `Veeam Repository Share` without the entitlement.
     */
    purposeOption: (label: string): string => `[data-test="option-purpose-${kebabTestSegment(label)}"]`,

    /**
     * `ix-explorer` renders a `tn-file-picker`, whose inner `<input>` takes the
     * control name. Typable — `allowManualInput` defaults to true — so the path
     * goes in directly rather than being navigated as a tree.
     *
     * **Absent entirely for an External Share**, which points at someone else's
     * server; see {@link remotePath}.
     */
    path: '[data-test="input-path"]',
    name: '[data-test="input-name"]',
    /** "Description". The control is `comment`, which is also what middleware stores it as. */
    comment: '[data-test="input-comment"]',
    /** Replaces {@link path} for an External Share. */
    remotePath: '[data-test="chip-input-remote-path"]',

    /**
     * Everything below the fold. The options a purpose enables are *not*
     * rendered until this is expanded, so a test observing the preset engine
     * has to open it first.
     */
    advancedToggle: '[data-test="button-toggle-advanced-options"]',

    /**
     * Three advanced controls chosen for how they move between purposes.
     *
     * `aaplNameMangling` belongs to Default (and most others) but **not** to
     * Time Machine; `autoSnapshot` and `timeMachineQuota` are the reverse. So
     * the pair makes the swap observable in both directions, which is what
     * stops a test passing against a form that only ever adds fields.
     * `hostsAllow` is enabled for nearly every purpose and is the control that
     * should *not* move.
     */
    aaplNameMangling: '[data-test="checkbox-aapl-name-mangling"]',
    autoSnapshot: '[data-test="checkbox-auto-snapshot"]',
    timeMachineQuota: '[data-test="input-timemachine-quota"]',
    hostsAllow: '[data-test="chip-input-hostsallow"]',

    save: '[data-test="button-save"]',
  },

  /**
   * "No" on the "Configure ACL" prompt that follows share creation.
   *
   * `dialogService.confirm({ cancelText: 'No', hideCheckbox: true })`, so it is
   * the standard confirm dialog's cancel button despite the custom label —
   * hence the reference rather than a second copy of the id.
   */
  declineAclPrompt: confirmDialogLocators.cancel,

  /**
   * "Start" on the "Start SMB Service" dialog
   * (`start-service-dialog.component.html`, `testId="enable-service"`).
   *
   * The dialog appears only while the service is stopped.
   */
  startService: '[data-test="button-enable-service"]',
  /**
   * "No" on that same dialog.
   *
   * What the form specs click. SMB service state is global — starting it
   * changes which dialog every later test is shown — so a spec that only cares
   * about the form leaves the service alone.
   */
  declineStartService: '[data-test="button-do-not-start"]',

  /**
   * "Enable Now" on the Apple-extensions banner.
   *
   * Shown when the chosen purpose needs Apple SMB2/3 extensions — Time Machine
   * or Final Cut Pro — and the service does not have them on. While it is
   * showing, `extraDisabled` holds Save down, so this is not advice: it is the
   * only way forward from that purpose. It writes service-wide configuration
   * (`smb.update`), which outlives the share.
   */
  enableAppleExtensions: '[data-test="button-enable-apple-extensions"]',

  card: {
    /**
     * The SMB service switch in the card header — `service-<name>` under the
     * toggle's own prefix, where the name is middleware's (`cifs`), not the
     * label's. Starts or stops the service outright; there is no confirmation.
     *
     * It moves on click, before the service has; {@link serviceStatus} is the
     * state the card actually holds.
     */
    serviceToggle: '[data-test="toggle-service-cifs"]',
    /** The header's status readout, whose text is the service state as the card believes it. */
    serviceStatus: '[data-test="button-service-status-cifs"]',

    /**
     * A share's row in the dashboard card.
     *
     * The row tag goes through the library's normalizer (`e2e-recon-share`); the
     * cells inside the same row go through lodash (`e-2-e-recon-share`). See the
     * note in `locators/test-id.ts`.
     *
     * The card shows four shares, by name, so a spec keeps its shares few: a
     * fifth sorting ahead of the one a test wants pushes it off the card.
     */
    row: (name: string): string => `[data-test="row-card-smb-share-${kebabTestSegment(name)}"]`,

    /**
     * The row's action menu trigger.
     *
     * A kebab menu rather than inline buttons: `ix-table-actions-cell` only
     * renders buttons inline when there is one action, and SMB rows have four.
     */
    rowMenu: (name: string): string => `[data-test="button-card-smb-share-${kebabTestSegment(name)}-more-action"]`,

    /** Edit, inside that menu. Same shape as {@link rowMenuDelete}. */
    rowMenuEdit: (name: string): string => `[data-test="button-card-smb-share-${kebabTestSegment(name)}-more-action-mdi-pencil-row-action"]`,

    /**
     * A share's Description cell.
     *
     * A cell, so it is the lodash spelling — `e-2-e-…` — beside a row tag that
     * spells the same name `e2e-…`. See {@link row}.
     */
    description: (name: string): string => `[data-test="text-description-card-smb-share-${legacyKebabTestSegment(name)}-row-text"]`,

    /**
     * Delete, inside that menu.
     *
     * The id is the menu trigger's own id with the icon appended — and the icon
     * carries its library, so it is `mdi-delete`, not `delete`. Verified
     * against a running appliance; the template alone would not tell you this.
     */
    rowMenuDelete: (name: string): string => `[data-test="button-card-smb-share-${kebabTestSegment(name)}-more-action-mdi-delete-row-action"]`,

    /**
     * The per-row Enabled switch.
     *
     * `ix-table-toggle-cell` composes `<row tag>-row-toggle` under the column's
     * own id, so the column name leads. Through the library normalizer, like
     * the row and its actions — not the lodash spelling the text cells use.
     */
    enabledToggle: (name: string): string => `[data-test="toggle-enabled-card-smb-share-${kebabTestSegment(name)}-row-toggle"]`,
  },
} as const;
