import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { UpdateProfileChoices } from 'app/interfaces/system-update.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { UpdateProfileCard } from './update-profile-card.component';

describe('UpdateProfileCard', () => {
  let spectator: Spectator<UpdateProfileCard>;
  let loader: HarnessLoader;

  const mockProfiles: UpdateProfileChoices = {
    CONSERVATIVE: {
      name: 'Conservative',
      footnote: 'Recommended',
      description: 'Stable releases only.',
      available: true,
    },
    DEVELOPER: {
      name: 'Developer',
      footnote: '',
      description: 'Nightly builds for testing.',
      available: true,
    },
    CRITICAL: {
      name: 'Mission Critical',
      footnote: '',
      description: 'For NASA systems.',
      available: false,
    },
  };

  const createComponent = createComponentFactory({
    component: UpdateProfileCard,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('update.update'),
      ]),
      provideMockStore(),
      {
        provide: DialogService,
        useValue: {
          confirm: jest.fn(() => of(true)),
        },
      },
      {
        provide: SnackbarService,
        useValue: {
          success: jest.fn(),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        currentProfileId: 'CONSERVATIVE',
        profileChoices: mockProfiles,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads profile options into select', async () => {
    const select = await loader.getHarness(IxSelectHarness.with({ label: 'Select an update profile' }));
    const options = await select.getOptionLabels();
    expect(options).toEqual(['Conservative', 'Developer']);
  });

  it('sets the form control to current config profile on init', async () => {
    const select = await loader.getHarness(IxSelectHarness.with({ label: 'Select an update profile' }));
    const value = await select.getValue();
    expect(value).toBe('Conservative');
  });

  it('opens confirm dialog and applies profile', async () => {
    const dialog = spectator.inject(DialogService);
    const api = spectator.inject(ApiService);
    const snackbar = spectator.inject(SnackbarService);

    const select = await loader.getHarness(IxSelectHarness.with({ label: 'Select an update profile' }));
    await select.setValue('Developer');

    const button = spectator.query('button[ixTest="apply-profile"]') as HTMLButtonElement;
    spectator.click(button);

    expect(dialog.confirm).toHaveBeenCalled();
    expect(api.call).toHaveBeenCalledWith('update.update', [{ profile: 'DEVELOPER' }]);

    expect(snackbar.success).toHaveBeenCalledWith(expect.stringMatching('Switched to Developer update profile'));
  });

  it('emits profileSwitched event when profile is successfully applied', async () => {
    jest.spyOn(spectator.component.profileSwitched, 'emit');

    const select = await loader.getHarness(IxSelectHarness.with({ label: 'Select an update profile' }));
    await select.setValue('Developer');

    const button = spectator.query('button[ixTest="apply-profile"]') as HTMLButtonElement;
    spectator.click(button);

    expect(spectator.component.profileSwitched.emit).toHaveBeenCalled();
  });

  it('shows the list of available profiles', () => {
    const available = spectator.queryAll('.profiles-section.available .profile-name');
    expect(available).toHaveLength(2);

    expect(available[0].textContent).toContain('Conservative');
    expect(available[1].textContent).toContain('Developer');
  });

  it('shows the list of not available profiles', () => {
    const notAvailable = spectator.queryAll('.profiles-section.not-available .profile-name');
    expect(notAvailable).toHaveLength(1);

    expect(notAvailable[0].textContent).toContain('Mission Critical');
  });

  it('shows a separate Current Profile line when current profile is not available in the options', () => {
    spectator.setInput('currentProfileId', 'CRITICAL');

    const currentProfile = spectator.query('.current-profile');
    expect(currentProfile).toHaveText('Current Profile:Mission Critical');
  });

  it('shows raw current value when Current Profile is absent from profile choices at all', () => {
    spectator.setInput('currentProfileId', 'MISSING_PROFILE');

    const currentProfile = spectator.query('.current-profile');
    expect(currentProfile).toHaveText('Current Profile:MISSING_PROFILE');
  });

  it('does not show current profile when it is present in the options', () => {
    const currentProfile = spectator.query('.current-profile');
    expect(currentProfile).toBeNull();
  });
});
