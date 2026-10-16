/**
 * A dataset's Permissions card and the Unix Permissions Editor it opens.
 *
 * The card's Edit opens this editor only while the dataset's ACL is trivial. Anything else goes to
 * the ACL editor, which is `aclEditor` below.
 */
import { kebabTestSegment } from './test-id';

/** A row of the editor's Access Mode table. The ids say `user` where the form says `owner`. */
export type AccessWho = 'user' | 'group' | 'other';

/** A column of the same table. The ids say `execute` where the form says `Exec`. */
export type AccessRight = 'read' | 'write' | 'execute';

/** `text-dataset-path`, which the Unix editor and the ACL editor both show. */
const datasetPath = '[data-test="text-dataset-path"]';

export const permissionsLocators = {
  card: {
    /** `<tn-button testId="edit-permissions">` in the card's header. */
    edit: '[data-test="button-edit-permissions"]',

    /**
     * What one entry of a trivial ACL allows, for example `Read | Execute`, or `None`.
     *
     * `ix-permissions-item` tags it `['permissions-item', <name>, 'permissions']`. The name is the
     * owning user, the owning group, or `Other`. So the id changes when the owner or group does, and
     * an owner and a group with the same name would share it.
     *
     * An NFSv4 ACL's entries use the same component, named `owner@ - <user>`, `group@ - <group>` or
     * `everyone@`, and read `Allow | Full Control`.
     */
    entry: (name: string): string => `[data-test="text-permissions-item-${kebabTestSegment(name)}-permissions"]`,
  },

  editor: {
    /** The mountpoint the editor is acting on, `/mnt/<dataset>`. */
    datasetPath,

    /**
     * `ix-user-combobox formControlName="owner"`, a library `tn-autocomplete`. The input is
     * `autocomplete-owner` and its rows are `option-owner-<username>`.
     */
    user: '[data-test="autocomplete-owner"]',
    userOption: (username: string): string => `[data-test="option-owner-${kebabTestSegment(username)}"]`,
    /** "Apply User". The owner is sent only while it is ticked. */
    applyUser: '[data-test="checkbox-apply-user"]',

    /** `ix-group-combobox formControlName="ownerGroup"`, the same control for groups. */
    group: '[data-test="autocomplete-owner-group"]',
    groupOption: (group: string): string => `[data-test="option-owner-group-${kebabTestSegment(group)}"]`,
    /** "Apply Group". The group is sent only while it is ticked. */
    applyGroup: '[data-test="checkbox-apply-group"]',

    /** One box of the Access Mode table, `[testId]="[row.testId, column.testId]"`. */
    access: (who: AccessWho, right: AccessRight): string => `[data-test="checkbox-${who}-${right}"]`,

    /** `<tn-button testId="save">`. Saving runs `filesystem.setperm` and returns to the dataset. */
    save: '[data-test="button-save"]',

    /** "Set ACL". Opens the ACL editor on this path. Offered unless ACLs are off for it. */
    setAcl: '[data-test="button-set-acl"]',
  },

  /**
   * The "Select a preset ACL" dialog (`select-preset-modal.component.html`).
   *
   * The ACL editor raises it itself on a trivial ACL, with both radios, and Use
   * Preset raises it with the select alone. Its Cancel shares `button-cancel`
   * with the editor's own behind it, so it is not here.
   */
  presetDialog: {
    title: '[data-test="dialog-title-select-preset"]',
    /** "Select a preset ACL". Rendered only on the dialog the editor raises itself. */
    usePreset: '[data-test="radio-button-use-preset-true"]',
    /** Rendered only while a preset is to be used. Its options come from `filesystem.acltemplate.by_path`. */
    preset: '[data-test="select-preset-name"]',
    presetOption: (name: string): string => `[data-test="option-preset-name-${kebabTestSegment(name)}"]`,
    /** Puts the preset's entries into the form. Nothing is saved until the editor's Save. */
    continue: '[data-test="button-continue"]',
  },

  /**
   * The ACL editor (`dataset-acl-editor.component.html`) and its NFSv4 entry form
   * (`edit-nfs-ace.component.html`).
   *
   * The entry form's selects have no `testId`, so their ids fall back to the
   * control names (`tag`, `basicPermission`). There is one entry form on the page,
   * for whichever entry is selected, so the fallback is unique.
   */
  aclEditor: {
    /** The path being edited. */
    path: datasetPath,
    /** "Add Item". Appends an entry for a user, with Modify and Inherit, and selects it. */
    addItem: '[data-test="button-add-acl-item"]',
    /** "Use Preset". Opens {@link permissionsLocators.presetDialog} without its radios. */
    usePreset: '[data-test="button-use-preset"]',

    /**
     * The header's Owner and Owner Group. The same comboboxes, on the same
     * control names, as the Unix editor's, so the same ids.
     */
    owner: '[data-test="autocomplete-owner"]',
    ownerOption: (username: string): string => `[data-test="option-owner-${kebabTestSegment(username)}"]`,
    ownerGroup: '[data-test="autocomplete-owner-group"]',
    ownerGroupOption: (group: string): string => `[data-test="option-owner-group-${kebabTestSegment(group)}"]`,
    /** "Apply Owner" and "Apply Group". Not the Unix editor's `checkbox-apply-user`. */
    applyOwner: '[data-test="checkbox-apply-owner"]',
    applyGroup: '[data-test="checkbox-apply-group"]',

    /**
     * One entry in the list on the left, by its position in `filesystem.getacl`. Clicking it
     * selects it, and the entry form is then that entry's.
     */
    ace: (index: number): string => `[data-test="row-ace-${index}"]`,
    /** The entry's remove control. Every NFSv4 entry has one. */
    removeAce: (index: number): string => `[data-test="button-remove-ace-${index}"]`,

    /** Who. Its options come from the label, except group@, which is `group-at` so it is not Group's. */
    tag: '[data-test="select-tag"]',
    tagGroup: '[data-test="option-tag-group"]',

    /** `ix-user-combobox formControlName="user"` in the entry form. Rendered while Who is User. */
    user: '[data-test="autocomplete-user"]',
    userOption: (username: string): string => `[data-test="option-user-${kebabTestSegment(username)}"]`,
    /** `ix-group-combobox formControlName="group"`, the same control for groups. Rendered while Who is Group. */
    group: '[data-test="autocomplete-group"]',
    groupOption: (group: string): string => `[data-test="option-group-${kebabTestSegment(group)}"]`,

    /** ACL Type, by label: "Allow" or "Deny". */
    aceType: (label: string): string => `[data-test="radio-button-type-${kebabTestSegment(label)}"]`,

    /** Permissions Type, by label: "Basic" or "Advanced". */
    permissionType: (label: string): string => (
      `[data-test="radio-button-permission-type-${kebabTestSegment(label)}"]`
    ),
    /** Rendered while Permissions Type is Basic, which a new entry is. */
    basicPermission: '[data-test="select-basic-permission"]',
    /** By label: "Read", "Modify", "Traverse" or "Full Control". */
    basicPermissionOption: (label: string): string => (
      `[data-test="option-basic-permission-${kebabTestSegment(label)}"]`
    ),
    /** Rendered while Permissions Type is Advanced. By label, for example "Read Data" or "Read ACL". */
    advancedPermission: (label: string): string => (
      `[data-test="checkbox-advanced-permissions-${kebabTestSegment(label)}"]`
    ),

    /** Flags Type, by label: "Basic" or "Advanced". */
    flagsType: (label: string): string => `[data-test="radio-button-flags-type-${kebabTestSegment(label)}"]`,
    /** Rendered while Flags Type is Basic. By label: "Inherit" or "No Inherit". */
    basicFlag: (label: string): string => `[data-test="radio-button-basic-flag-${kebabTestSegment(label)}"]`,
    /** Rendered while Flags Type is Advanced. By label, for example "Directory Inherit". */
    advancedFlag: (label: string): string => `[data-test="checkbox-advanced-flags-${kebabTestSegment(label)}"]`,

    /** "Save Access Control List". Runs `filesystem.setacl`, then returns to where the editor was opened. */
    save: '[data-test="button-save-acl"]',
    /** Leaves without saving. Shares its id with the preset dialog's Cancel, which is not open then. */
    cancel: '[data-test="button-cancel"]',

    /** An entry in the list, by its position: `[tnTestId]="['ace', i]"` in `acl-editor-list`. */
    entry: (index: number): string => `[data-test="row-ace-${index}"]`,
    /**
     * The alert marker an invalid entry shows, rendered only while the entry is in `acesWithError`.
     * Clicking it removes the entry.
     */
    entryError: (index: number): string => `[data-test="button-remove-ace-error-${index}"]`,
  },
} as const;
