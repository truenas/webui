import {
  Component, ChangeDetectionStrategy, input, output, computed,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Role, roleNames } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-row',
  templateUrl: './user-row.component.html',
  styleUrls: ['./user-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    TestDirective,
    TranslateModule,
    MatTooltipModule,
    MatButtonModule,
    MatCheckboxModule,
    MapValuePipe,
  ],
})
export class UserRowComponent {
  readonly user = input.required<User>();
  readonly selected = input<boolean>(false);

  readonly selectionChange = output();

  protected readonly requiredRoles = [Role.AccountWrite];
  protected readonly userRoleLabels = roleNames;
  protected readonly isLocked = computed(() => this.user().locked);

  constructor(
    private dialog: DialogService,
    private translate: TranslateService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
  ) {}
}
