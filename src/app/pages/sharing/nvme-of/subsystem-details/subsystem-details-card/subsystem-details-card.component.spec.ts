import { Clipboard } from '@angular/cdk/clipboard';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { byText } from '@ngneat/spectator';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import {
  SubsystemDetailsCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-details-card/subsystem-details-card.component';

describe('SubsystemDetailsCardComponent', () => {
  let spectator: Spectator<SubsystemDetailsCardComponent>;
  let loader: HarnessLoader;
  let details: DetailsTableHarness;

  const subsystem = {
    id: 1,
    name: 'Test Subsystem',
    subnqn: 'nqn.2014-08.org.nvmexpress:uuid:12345678',
  } as NvmeOfSubsystemDetails;

  const createComponent = createComponentFactory({
    component: SubsystemDetailsCardComponent,
    providers: [
      mockApi([
        mockCall('nvmet.subsys.update'),
      ]),
      mockProvider(Clipboard, {
        copy: jest.fn(() => true),
      }),
      mockProvider(NvmeOfService, {
        updateSubsystem: jest.fn(() => of(undefined)),
      }),
      mockProvider(SnackbarService),
      mockProvider(NvmeOfStore, {
        initialize: jest.fn(),
      }),
      mockProvider(FormErrorHandlerService),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        subsystem,
      },
    });

    jest.spyOn(spectator.component.nameUpdated, 'emit');

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    details = await loader.getHarness(DetailsTableHarness);
  });

  it('shows name and NQN', async () => {
    const values = await details.getValues();

    expect(values).toEqual({
      Name: 'Test Subsystem',
      NQN: expect.stringContaining('nqn.2014-08.org.nvmexpress:uuid:12345678'),
    });
  });

  it('updates name when it is edited', async () => {
    // Mock the successful response
    const nvmeOfService = spectator.inject(NvmeOfService);
    const nvmeOfStore = spectator.inject(NvmeOfStore);
    const snackbarService = spectator.inject(SnackbarService);

    // Access the form directly (even though it's protected) using bracket notation
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const form = spectator.component['form'];
    form.patchValue({ name: 'Updated Subsystem' });
    spectator.detectChanges();

    // Call updateField directly (even though it's protected) using bracket notation
    // eslint-disable-next-line @typescript-eslint/dot-notation
    spectator.component['updateField']('name');

    // Wait for async operations
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(nvmeOfService.updateSubsystem).toHaveBeenCalledWith(subsystem, { name: 'Updated Subsystem' });
    expect(nvmeOfStore.initialize).toHaveBeenCalled();
    expect(spectator.component.nameUpdated.emit).not.toHaveBeenCalled();
    expect(snackbarService.success).toHaveBeenCalled();
  });

  it('updates NQN when it is edited', async () => {
    // Mock the successful response
    const nvmeOfService = spectator.inject(NvmeOfService);
    const nvmeOfStore = spectator.inject(NvmeOfStore);
    const snackbarService = spectator.inject(SnackbarService);

    // Access the form directly (even though it's protected) using bracket notation
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const form = spectator.component['form'];
    form.patchValue({ subnqn: 'nqn.2014-08.org.nvmexpress:uuid:11111111' });
    spectator.detectChanges();

    // Call updateField directly (even though it's protected) using bracket notation
    // eslint-disable-next-line @typescript-eslint/dot-notation
    spectator.component['updateField']('subnqn');

    // Wait for async operations
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(nvmeOfService.updateSubsystem).toHaveBeenCalledWith(subsystem, { subnqn: 'nqn.2014-08.org.nvmexpress:uuid:11111111' });
    expect(nvmeOfStore.initialize).toHaveBeenCalled();
    expect(snackbarService.success).toHaveBeenCalled();
  });

  it('copies NQN to clipboard when copy is pressed', () => {
    spectator.click(byText('Copy'));

    expect(spectator.inject(Clipboard).copy).toHaveBeenCalledWith('nqn.2014-08.org.nvmexpress:uuid:12345678');
  });
});
