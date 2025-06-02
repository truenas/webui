import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfNamespace, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { NamespaceDescriptionComponent } from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemNamespacesCardComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-namespaces-card/subsystem-namespaces-card.component';

describe('SubsystemNamespacesCardComponent', () => {
  let spectator: Spectator<SubsystemNamespacesCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SubsystemNamespacesCardComponent,
    imports: [
      NamespaceDescriptionComponent,
    ],
    providers: [
      mockApi([
        mockCall('nvmet.namespace.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(SnackbarService),
      mockProvider(NvmeOfStore, {
        initialize: jest.fn(),
      }),
    ],
  });

  // Helper function to initialize component and loader
  function initComponent(props: Partial<NvmeOfSubsystemDetails>): void {
    spectator = createComponent({
      props: {
        subsystem: props as NvmeOfSubsystemDetails,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  describe('no namespaces', () => {
    it('shows a warning when subsystem has no namespaces', async () => {
      initComponent({
        name: 'Test Subsystem',
        namespaces: [],
      });

      const icon = await loader.getHarness(IxIconHarness);
      expect(await icon.getName()).toBe('mdi-alert');
      expect(spectator.query('.no-namespaces-warning')).toHaveText(helptextNvmeOf.noNamespacesWarning);
    });
  });

  describe('has namespaces', () => {
    beforeEach(() => {
      initComponent({
        name: 'Test Subsystem',
        namespaces: [
          {
            id: 1,
            device_type: NvmeOfNamespaceType.File,
            device_path: '/mnt/dozer/testfile',
          },
          {
            id: 2,
            device_type: NvmeOfNamespaceType.Zvol,
            device_path: '/dev/zvol/testpool/testzvol',
          },
        ] as NvmeOfNamespace[],
      });
    });

    it('shows namespace type and path', () => {
      const namespaceRows = spectator.queryAll('.namespace');
      expect(namespaceRows).toHaveLength(2);

      const firstNamespace = namespaceRows[0];
      expect(firstNamespace).toHaveText('File\n—\n/mnt/dozer/testfile');

      const secondNamespace = namespaceRows[1];
      expect(secondNamespace).toHaveText('Zvol\n—\n/dev/zvol/testpool/testzvol');
    });

    it('has a delete button that makes an API call to delete a namespace', async () => {
      const deleteButton = await loader.getHarness(IxIconHarness.with({ name: 'clear' }));
      await deleteButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Please Confirm',
        message: 'Are you sure you want to delete this namespace?',
      }));

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.delete', [1]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();

      expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalled();
    });
  });
});
