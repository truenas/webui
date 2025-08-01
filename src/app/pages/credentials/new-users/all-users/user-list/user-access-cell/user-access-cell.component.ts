import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { roleNames } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@Component({
  selector: 'ix-user-access-cell',
  templateUrl: './user-access-cell.component.html',
  styleUrls: ['./user-access-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxIconComponent, MatTooltip, TranslateModule],
})
export class UserAccessCellComponent {
  private translate = inject(TranslateService);

  readonly user = input.required<User>();

  protected readonly roles = computed<string>(() => {
    return this.user().roles
      .map((role) => this.translate.instant(roleNames.get(role) || role))
      .join(', ');
  });
}
