import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, of, switchMap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { IconActionConfig } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { AuthService } from 'app/services/auth/auth.service';

@Component({
  selector: 'ix-cell-actions',
  templateUrl: './ix-cell-actions.component.html',
  styleUrls: ['./ix-cell-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCellActionsComponent<T> extends ColumnComponent<T> {
  protected Role = Role;
  actions: IconActionConfig<T>[];

  private authService = inject(AuthService);
  private translateService = inject(TranslateService);

  getTooltip(action: IconActionConfig<T>, row: T): Observable<string> {
    return this.authService.hasRole(action.roles?.length ? action.roles : [Role.Readonly]).pipe(
      switchMap((hasRole) => {
        if (!hasRole) {
          return of(this.translateService.instant('Missing required permissions for this action'));
        }

        return action.dynamicTooltip ? action.dynamicTooltip(row) : of(action.tooltip || '');
      }),
    );
  }

  shouldDisable(action: IconActionConfig<T>, row: T): Observable<boolean> {
    return this.authService.hasRole(action.roles?.length ? action.roles : [Role.Readonly]).pipe(
      switchMap((hasRole) => {
        if (!hasRole) {
          return of(true);
        }

        return action.disabled ? (action.disabled(row)) : of(false);
      }),
    );
  }
}

export function actionsColumn<T>(
  options: Partial<IxCellActionsComponent<T>>,
): Column<T, IxCellActionsComponent<T>> {
  return { type: IxCellActionsComponent, ...options };
}
