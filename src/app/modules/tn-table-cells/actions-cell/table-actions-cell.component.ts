import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnIconButtonComponent,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
} from '@truenas/ui-components';
import { isObservable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';

/**
 * tn-table replacement for the ix-table `actionsWithMenuColumn`/`actionsColumn`
 * cell renderers. Built entirely on tn-* primitives (`tn-icon-button`,
 * `tn-menu`) so dashboard card tables carry no Material in their action column.
 * Shared across the sharing and data-protection card tables.
 *
 * - `mode = 'menu'` (default): one visible action renders as a single icon
 *   button; more than one collapses behind a "⋮" trigger (parity with
 *   `actionsWithMenuColumn`).
 * - `mode = 'inline'`: every visible action renders as its own icon button
 *   (parity with `actionsColumn`, used by the WebShare card).
 *
 * Test IDs are produced by each tn component's native `testId` input, which the
 * library prefixes with its element type (`button-…`, `menu-item-…`) via
 * `composeTestId` — matching the legacy `ixTest` output for icon buttons.
 */
@Component({
  selector: 'ix-table-actions-cell',
  templateUrl: './table-actions-cell.component.html',
  styleUrls: ['./table-actions-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    TranslateModule,
    RequiresRolesDirective,
    TnIconButtonComponent,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
  ],
})
export class TableActionsCellComponent<T = unknown> {
  private destroyRef = inject(DestroyRef);

  readonly actions = input.required<IconActionConfig<T>[]>();
  readonly row = input.required<T>();
  readonly uniqueRowTag = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly mode = input<'menu' | 'inline'>('menu');

  protected readonly visibleActions = signal<IconActionConfig<T>[]>([]);

  constructor() {
    // Recompute visibility whenever the row or action list changes. `hidden`
    // may be synchronous or an Observable, mirroring ix-cell-actions-with-menu.
    effect(() => {
      const row = this.row();
      const actions = this.actions();

      this.visibleActions.set([]);

      actions.forEach((action) => {
        if (!action.hidden) {
          this.visibleActions.update((items) => [...items, action]);
          return;
        }

        const result$ = action.hidden(row);
        if (isObservable(result$)) {
          result$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((shouldHide) => {
            if (!shouldHide) {
              this.visibleActions.update((items) => [...items, action]);
            }
          });
        } else if (!result$) {
          this.visibleActions.update((items) => [...items, action]);
        }
      });
    });
  }

  protected getDisabledTooltip(action: IconActionConfig<T>): string {
    if (!action.disabledTooltip) {
      return '';
    }
    if (typeof action.disabledTooltip === 'function') {
      return action.disabledTooltip(this.row());
    }
    return action.disabledTooltip;
  }

  protected onActionClick(event: MouseEvent | null, action: IconActionConfig<T>): void {
    event?.stopPropagation();
    action.onClick(this.row());
  }

  /**
   * `tn-menu-item`'s `testId` input accepts a single string (unlike the array
   * `testId` on `tn-icon-button`), so join the segments into the semantic base
   * here. `tn-menu` composes the `button-` element-type prefix and kebab-
   * normalizes the result, matching the legacy `button-…-row-action` id.
   */
  protected menuItemTestId(action: IconActionConfig<T>): string {
    return [this.uniqueRowTag(), 'more-action', action.iconName, 'row-action'].join('-');
  }
}
