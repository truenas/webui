import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ChangePasswordDialog } from 'app/modules/layout/topbar/change-password-dialog/change-password-dialog.component';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';

describe('ChangePasswordDialogComponent', () => {
  let spectator: Spectator<ChangePasswordDialog>;

  const createComponent = createComponentFactory({
    component: ChangePasswordDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders the change password form', () => {
    const formComponent = spectator.query(ChangePasswordFormComponent);
    expect(formComponent).toBeTruthy();
  });
});
