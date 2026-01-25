import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Group } from 'app/interfaces/group.interface';
import { IxGroupComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-group-combobox/ix-group-combobox.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { UserService } from 'app/services/user.service';

@Component({
  selector: 'ix-test-host',
  template: '<ix-group-combobox [formControl]="control" [label]="label" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IxGroupComboboxComponent, ReactiveFormsModule],
})
class TestHostComponent {
  control = new FormControl<string>('');
  label = 'Test Group' as TranslatedString;
}

describe('IxGroupComboboxComponent', () => {
  let spectator: Spectator<TestHostComponent>;

  const createComponent = createComponentFactory({
    component: TestHostComponent,
    providers: [
      mockApi([]),
      mockProvider(UserService, {
        groupQueryDsCache: jest.fn(() => of([
          { group: 'wheel' },
          { group: 'users' },
        ] as Group[])),
        getGroupByName: jest.fn((groupName: string) => of({ group: groupName })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows label', () => {
    expect(spectator.query('label')).toHaveText('Test Group');
  });

  it('renders combobox input', () => {
    const input = spectator.query('input');
    expect(input).toExist();
  });
});
