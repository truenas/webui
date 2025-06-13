import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Role } from 'app/enums/role.enum';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/new-users/user-form/allowed-access-section/allowed-access-section.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';

describe('AllowedAccessSectionComponent', () => {
  let spectator: Spectator<AllowedAccessSectionComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AllowedAccessSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(UserFormStore, {
        setAllowedAccessConfig: jest.fn(),
        updateSetupDetails: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  // TODO: Test showing current values when editing a user

  it('updates store when allowed access checkboxes are changed', async () => {
    const smbCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'SMB Access' }));
    const shellCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'Shell Access' }));

    await smbCheckbox.check();
    await shellCheckbox.check();

    expect(spectator.inject(UserFormStore).setAllowedAccessConfig).toHaveBeenCalledWith({
      smbAccess: true,
      truenasAccess: false,
      sshAccess: false,
      shellAccess: true,
    });
  });

  it('shows role field when TrueNAS access is selected', async () => {
    const truenasCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'TrueNAS Access' }));
    await truenasCheckbox.check();

    const roleInput = await loader.getHarness(IxSelectHarness);
    expect(roleInput).toBeTruthy();

    const options = await roleInput.getOptionLabels();
    expect(options).toEqual([
      'Select Role',
      'Full Admin',
      'Sharing Admin',
      'Readonly Admin',
    ]);
  });

  it('updates store when role is changed', async () => {
    const truenasCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'TrueNAS Access' }));
    await truenasCheckbox.check();

    const roleInput = await loader.getHarness(IxSelectHarness);
    await roleInput.setValue('Full Admin');

    expect(spectator.inject(UserFormStore).setAllowedAccessConfig).toHaveBeenCalledWith({
      smbAccess: true,
      truenasAccess: true,
      sshAccess: false,
      shellAccess: false,
    });

    expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenCalledWith({
      role: Role.FullAdmin,
    });
  });
});
