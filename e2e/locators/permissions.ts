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

    /** `ix-user-combobox formControlName="user"` in the entry form. Rendered while Who is User. */
    user: '[data-test="autocomplete-user"]',
    userOption: (username: string): string => `[data-test="option-user-${kebabTestSegment(username)}"]`,
    /** Rendered while Permissions Type is Basic, which a new entry is. */
    basicPermission: '[data-test="select-basic-permission"]',
    /** By label: "Read", "Modify", "Traverse" or "Full Control". */
    basicPermissionOption: (label: string): string => (
      `[data-test="option-basic-permission-${kebabTestSegment(label)}"]`
    ),

    /** "Save Access Control List". Runs `filesystem.setacl`, then returns to where the editor was opened. */
    save: '[data-test="button-save-acl"]',
  },
} as const;
