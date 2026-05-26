import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextTopbar } from 'app/helptext/topbar';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-truecommand-signup-modal',
  templateUrl: './truecommand-signup-modal.component.html',
  styleUrls: ['./truecommand-signup-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class TruecommandSignupModalComponent {
  protected dialogRef = inject<DialogRef<boolean, TruecommandSignupModalComponent>>(DialogRef);
  private window = inject<Window>(WINDOW);

  readonly helptext = helptextTopbar;
  protected readonly requiredRoles = [Role.TrueCommandWrite];

  onSignup(): void {
    this.window.open('https://portal.truenas.com');
    this.dialogRef.close(false);
  }
}
