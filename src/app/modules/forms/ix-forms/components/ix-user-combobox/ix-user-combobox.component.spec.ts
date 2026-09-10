import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { User } from 'app/interfaces/user.interface';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-user-combobox/ix-user-combobox.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { UserService } from 'app/services/user.service';

@Component({
  selector: 'ix-test-host',
  template: '<ix-user-combobox [formControl]="control" [label]="label" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IxUserComboboxComponent, ReactiveFormsModule],
})
class TestHostComponent {
  // `@ngneat/reactive-forms`, like every real form in the app: its `setAsyncValidators`
  // override is what made attaching the existence validator emit a status change.
  control = new FormControl<string>('', Validators.required);
  label = 'Test User' as TranslatedString;
}

describe('IxUserComboboxComponent', () => {
  let spectator: Spectator<TestHostComponent>;

  const createComponent = createComponentFactory({
    component: TestHostComponent,
    providers: [
      mockApi([]),
      mockProvider(UserService, {
        userQueryDsCache: jest.fn(() => of([
          { username: 'root' },
          { username: 'admin' },
        ] as User[])),
        getUserByName: jest.fn((username: string) => of({ username } as User)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows label', () => {
    expect(spectator.query('label')).toHaveText('Test User');
  });

  it('renders combobox input', () => {
    const input = spectator.query('input');
    expect(input).toExist();
  });

  // NAS-143522: "Add Rsync Task" opened with "User is required" already in red. Attaching
  // the existence validator emitted a status change, which ix-errors turned into a visible
  // message — and marked the untouched control touched on the way.
  it('does not surface a validation error before the field is interacted with', () => {
    expect(spectator.component.control.touched).toBe(false);
    expect(spectator.component.control.dirty).toBe(false);
    expect(spectator.query('.form-error')).not.toExist();
  });

  it('still attaches the user existence validator', () => {
    expect(spectator.component.control.asyncValidator).toBeTruthy();
  });
});
