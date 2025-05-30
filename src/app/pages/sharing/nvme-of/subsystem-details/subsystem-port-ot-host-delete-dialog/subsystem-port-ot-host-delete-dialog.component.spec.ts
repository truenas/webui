import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PortOrHostDeleteType } from 'app/interfaces/nvme-of.interface';
import { SubsystemPortOrHostDeleteDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-port-ot-host-delete-dialog/subsystem-port-ot-host-delete-dialog.component';

describe('SubsystemPortOrHostDeleteDialogComponent', () => {
  let spectator: Spectator<SubsystemPortOrHostDeleteDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SubsystemPortOrHostDeleteDialogComponent,
    providers: [
      mockAuth(),
      {
        provide: MatDialogRef,
        useValue: { close: jest.fn() },
      },
    ],
  });

  describe('when not in use', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              name: 'nvme1',
              type: PortOrHostDeleteType.Port,
              subsystemsInUse: [],
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows a simple confirmation message', () => {
      expect(spectator.query('.message')?.textContent).toContain('Are you sure you want to delete');
    });

    it('closes with force: false when confirmed', async () => {
      const button = await loader.getHarness(MatButtonHarness.with({ text: /Delete/i }));
      await button.click();

      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
        confirmed: true,
        force: false,
      });
    });
  });

  describe('when in use', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              name: 'nvme1',
              type: PortOrHostDeleteType.Port,
              subsystemsInUse: [{ name: 'subsys1' }, { name: 'subsys2' }],
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows warning with subsystem names', () => {
      const content = spectator.queryAll('li').map((li) => li.textContent.trim());
      expect(content).toEqual(['subsys1', 'subsys2']);
    });

    it('closes with force: true when confirmed', async () => {
      const button = await loader.getHarness(MatButtonHarness.with({ text: /Delete Anyway/i }));
      await button.click();

      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
        confirmed: true,
        force: true,
      });
    });
  });
});
