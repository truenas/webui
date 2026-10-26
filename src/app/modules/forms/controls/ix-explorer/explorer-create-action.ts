import { Signal } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Contract between `ix-explorer` and projected create-actions
 * (`ix-explorer-create-dataset`, `ix-explorer-create-zvol`).
 *
 * The projected component decides whether creation is allowed and runs its own
 * creation flow (dialog / slide-in); `ix-explorer` surfaces the action through the
 * picker popup's create button, then reloads the listing and selects the created path.
 */
export abstract class ExplorerCreateAction {
  /** Identifies the action in the picker's `createAction` events, e.g. 'create-dataset'. */
  abstract readonly id: string;

  /** Translated label for the create button in the picker popup footer. */
  abstract readonly label: string;

  /**
   * Fully-qualified sprite icon id shown in the picker's inline creation row,
   * e.g. 'tn-dataset'. Defaults to the picker's folder icon when omitted.
   */
  readonly icon?: string;

  /** Whether the current user is allowed to create (role check). */
  abstract readonly canCreate: Signal<boolean>;

  /** Whether creation makes sense under the given browsed directory. */
  abstract canCreateAt(parentPath: string): boolean;

  /**
   * Consumer-owned creation flow (dialog / slide-in); emits the created path,
   * or null when cancelled. Used when `createInline` is not provided.
   */
  create?(parentPath: string): Observable<string | null>;

  /**
   * Opts the action into the picker's built-in inline creation row: pressing
   * the button renders an editable name row in the listing instead of running
   * `create`. Called with the browsed directory and the entered name; resolve
   * with the created path (the picker refreshes the listing and selects it),
   * or reject with an Error whose message is shown inline for retry. The row
   * auto-submits when it loses focus with a non-empty name, so this can fire
   * for an abandoned row — implementations must tolerate the created item
   * being left behind.
   */
  createInline?(parentPath: string, name: string): Promise<string>;
}
