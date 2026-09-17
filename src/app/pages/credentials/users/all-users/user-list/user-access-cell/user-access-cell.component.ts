import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent, TnTestIdDirective, TnTooltipDirective } from '@truenas/ui-components';
import { formatRoleNames } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';

@Component({
  selector: 'ix-user-access-cell',
  templateUrl: './user-access-cell.component.html',
  styleUrls: ['./user-access-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnIconComponent, TnTooltipDirective, TnTestIdDirective, TranslateModule],
})
export class UserAccessCellComponent {
  private translate = inject(TranslateService);

  readonly user = input.required<User>();

  /**
   * Row tag of the user this cell belongs to, so each access indicator is addressable on its own
   * row. The cell as a whole is tagged by the list template; these are the icons inside it, which
   * are the only place the SMB / WebShare / SSH / API state is shown in the table.
   */
  readonly uniqueRowTag = input.required<string>();

  protected readonly roles = computed<string>(() => {
    return formatRoleNames(this.user().roles, (key) => this.translate.instant(key));
  });
}
