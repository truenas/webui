import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnIconButtonComponent,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
} from '@truenas/ui-components';
import { Observable, of, Subscription } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import { stopRowActivationKeys } from 'app/modules/tn-table-cells/stop-row-activation-keys';

/**
 * tn-table action column built only on tn-* primitives. `mode = 'menu'` (default) renders one action
 * as an icon button and several behind a "⋮" menu; `mode = 'inline'` renders each as its own button.
 * The library prefixes test ids with `button-` for both the icon buttons and the menu items, matching
 * the ids these replaced.
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
  private authService = inject(AuthService);

  /** One `hasRole` stream per role set, so the template's `async` pipe gets the same one on every check. */
  private roleChecks = new Map<string, Observable<boolean>>();
  private readonly anyone = of(true);

  readonly actions = input.required<IconActionConfig<T>[]>();
  readonly row = input.required<T>();
  readonly uniqueRowTag = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly mode = input<'menu' | 'inline'>('menu');

  protected readonly stopRowActivationKeys = stopRowActivationKeys;

  protected readonly visibleActions = signal<IconActionConfig<T>[]>([]);
  protected readonly showsInlineActions = computed(() => this.mode() === 'inline' || this.visibleActions().length === 1);

  /** Async `hidden()` subscriptions for the current effect run; torn down before each re-run. */
  private hiddenSubscriptions = new Subscription();

  constructor() {
    this.destroyRef.onDestroy(() => this.hiddenSubscriptions.unsubscribe());

    // Recompute visibility whenever the row or action list changes.
    effect(() => {
      const row = this.row();
      const actions = this.actions();

      // Drop the previous run's subscriptions so re-runs (row/actions changes)
      // neither leak nor let a stale async emission push into the reset list.
      this.hiddenSubscriptions.unsubscribe();
      this.hiddenSubscriptions = new Subscription();

      // Track visibility per index and project in declaration order, so an async
      // hidden() resolving out of order cannot reorder the rendered buttons.
      const visible = new Array<boolean>(actions.length).fill(false);
      const publish = (): void => {
        this.visibleActions.set(actions.filter((_, index) => visible[index]));
      };

      actions.forEach((action, index) => {
        if (!action.hidden) {
          visible[index] = true;
          return;
        }

        // `hidden` always resolves through an Observable (parity with the
        // `async` pipe in ix-cell-actions); an out-of-order emission re-publishes
        // against the index, so it cannot reorder the rendered buttons.
        this.hiddenSubscriptions.add(action.hidden(row).subscribe((shouldHide) => {
          visible[index] = !shouldHide;
          publish();
        }));
      });

      publish();
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

  /**
   * Whether the user may run a menu action, as `*ixRequiresRoles` decides it: no roles
   * means anyone, otherwise any one of them.
   */
  protected hasRoles(roles: Role[]): Observable<boolean> {
    if (!roles.length) {
      return this.anyone;
    }

    const key = roles.join(',');
    let check$ = this.roleChecks.get(key);
    if (!check$) {
      check$ = this.authService.hasRole(roles);
      this.roleChecks.set(key, check$);
    }
    return check$;
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
