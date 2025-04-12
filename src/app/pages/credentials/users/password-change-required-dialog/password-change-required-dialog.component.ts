import {
  ChangeDetectionStrategy, Component,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatDialogClose } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-password-change-required-dialog',
  templateUrl: './password-change-required-dialog.component.html',
  styleUrls: ['./password-change-required-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    ChangePasswordFormComponent,
    MatButton,
    MatCard,
    MatToolbarRow,
    TestDirective,
    MatDialogClose,
  ],
})
export class PasswordChangeRequiredDialog {
  protected wasPasswordChanged = signal(false);

  passwordChanged(): void {
    this.wasPasswordChanged.set(true);
  }
}
