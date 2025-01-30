import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ChangePasswordDialogComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-dialog.component';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';

describe('ChangePasswordDialogComponent', () => {
  let spectator: Spectator<ChangePasswordDialogComponent>;

  const createComponent = createComponentFactory({
    component: ChangePasswordDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
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
