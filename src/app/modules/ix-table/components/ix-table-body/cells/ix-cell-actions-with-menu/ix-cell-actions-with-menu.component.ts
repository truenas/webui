import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, effect, signal,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { isObservable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { ColumnComponent, Column } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-cell-actions-with-menu',
  templateUrl: './ix-cell-actions-with-menu.component.html',
  styleUrls: ['./ix-cell-actions-with-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTooltip,
    RequiresRolesDirective,
    MatIconButton,
    IxIconComponent,
    AsyncPipe,
    TestDirective,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    TranslateModule,
  ],
})
export class IxCellActionsWithMenuComponent<T> extends ColumnComponent<T> {
  actions: IconActionConfig<T>[] = [];
  Role = Role;

  readonly visibleActions = signal<IconActionConfig<T>[]>([]);

  constructor() {
    super();

    effect(() => {
      this.visibleActions.set([]);

      this.actions.forEach((action) => {
        if (!action.hidden) {
          this.visibleActions.update((item) => [...item, action]);
        } else {
          const result$ = action.hidden(this.row());

          if (isObservable(result$)) {
            result$.pipe(untilDestroyed(this)).subscribe((shouldHide) => {
              if (!shouldHide) {
                this.visibleActions.update((item) => [...item, action]);
              }
            });
          } else if (!result$) {
            this.visibleActions.update((item) => [...item, action]);
          }
        }
      });
    });
  }
}

export function actionsWithMenuColumn<T>(
  options: Partial<IxCellActionsWithMenuComponent<T>>,
): Column<T, IxCellActionsWithMenuComponent<T>> {
  return { type: IxCellActionsWithMenuComponent, ...options };
}
