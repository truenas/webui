import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { UpdateProfileChoices } from 'app/interfaces/system-update.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
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
  };

  const createComponent = createComponentFactory({
    component: UpdateProfileCard,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
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
      {
        provide: UpdateService,
        useValue: {
          getUpdateConfig: jest.fn(() => of({ profile: 'CONSERVATIVE' })),
          updateConfig: jest.fn(() => of({})),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
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
    const updateService = spectator.inject(UpdateService);
    const snackbar = spectator.inject(SnackbarService);

    const select = await loader.getHarness(IxSelectHarness.with({ label: 'Select an update profile' }));
    await select.setValue('Developer');

    const button = spectator.query('button[ixTest="apply-profile"]') as HTMLButtonElement;
    spectator.click(button);

    expect(dialog.confirm).toHaveBeenCalled();
    expect(updateService.updateConfig).toHaveBeenCalledWith({ profile: 'DEVELOPER' });

    expect(snackbar.success).toHaveBeenCalledWith(expect.stringMatching('Update profile saved'));
  });
});
