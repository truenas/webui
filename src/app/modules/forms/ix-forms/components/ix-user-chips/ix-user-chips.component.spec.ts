import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { User } from 'app/interfaces/user.interface';
import { IxUserChipsComponent } from 'app/modules/forms/ix-forms/components/ix-user-chips/ix-user-chips.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { UserService } from 'app/services/user.service';

@Component({
  selector: 'ix-test-host',
  template: '<ix-user-chips [formControl]="control" [label]="label" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IxUserChipsComponent, ReactiveFormsModule],
})
class TestHostComponent {
  control = new FormControl<string[]>([]);
  label = 'Test Users' as TranslatedString;
}

describe('IxUserChipsComponent', () => {
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
    expect(spectator.query('label')).toHaveText('Test Users');
  });

  it('renders chip grid input', () => {
    const input = spectator.query('input');
    expect(input).toExist();
  });
});
