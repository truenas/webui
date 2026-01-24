import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Group } from 'app/interfaces/group.interface';
import { IxGroupChipsComponent } from 'app/modules/forms/ix-forms/components/ix-group-chips/ix-group-chips.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { UserService } from 'app/services/user.service';

@Component({
  selector: 'ix-test-host',
  template: '<ix-group-chips [formControl]="control" [label]="label" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IxGroupChipsComponent, ReactiveFormsModule],
})
class TestHostComponent {
  control = new FormControl<string[]>([]);
  label = 'Test Groups' as TranslatedString;
}

describe('IxGroupChipsComponent', () => {
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
    expect(spectator.query('label')).toHaveText('Test Groups');
  });

  it('renders chip grid input', () => {
    const input = spectator.query('input');
    expect(input).toExist();
  });
});
