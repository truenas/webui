import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { NamespaceDescriptionComponent } from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';
import { NamespaceFormComponent } from 'app/pages/sharing/nvme-of/namespaces/namespace-form/namespace-form.component';
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
      mockProvider(SnackbarService, {
        success: jest.fn(),
      }),
      mockProvider(NvmeOfStore, {
        initialize: jest.fn(),
      }),
    ],
  });

  function setupTest(subsystem: NvmeOfSubsystemDetails): void {
    spectator = createComponent({
      props: {
        subsystem,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  describe('no namespaces', () => {
    beforeEach(() => {
      setupTest({
        id: 1,
        namespaces: [],
      } as NvmeOfSubsystemDetails);
    });

    it('shows a warning when subsystem has no namespaces', () => {
      const warning = spectator.query('.no-namespaces-warning');
      expect(warning).toBeTruthy();
      expect(warning.textContent).toContain(helptextNvmeOf.noNamespacesWarning);
      expect(warning).toHaveDescendant('ix-icon');
    });
  });

  describe('with namespaces', () => {
    const subsystem = {
      id: 1,
      namespaces: [
        {
          id: 10,
          device_type: NvmeOfNamespaceType.File,
          device_path: '/mnt/pool1/namespace1',
        },
        {
          id: 11,
          device_type: NvmeOfNamespaceType.Zvol,
          device_path: '/dev/zvol/pool2/namespace2',
        },
      ],
    } as NvmeOfSubsystemDetails;

    beforeEach(() => {
      setupTest(subsystem);
    });

    it('lists namespaces associated with the subsystem', () => {
      const namespaceList = spectator.queryAll('.namespace');
      expect(namespaceList).toHaveLength(2);
      expect(namespaceList[0].textContent).toContain('File');
      expect(namespaceList[0].textContent).toContain('/mnt/pool1/namespace1');
      expect(namespaceList[1].textContent).toContain('Zvol');
      expect(namespaceList[1].textContent).toContain('/dev/zvol/pool2/namespace2');
    });

    it('opens slide-in to edit namespace when edit button is clicked', async () => {
      const editButton = await loader.getHarness(IxIconHarness.with({ name: 'edit' }));
      await editButton.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
        NamespaceFormComponent,
        { data: subsystem.namespaces[0] },
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Namespace updated.');
      expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalled();
    });

    it('shows confirmation dialog and makes API call to delete namespace', async () => {
      const deleteButton = await loader.getHarness(IxIconHarness.with({ name: 'clear' }));
      await deleteButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
        title: 'Please Confirm',
        message: 'Are you sure you want to delete this namespace?',
        buttonColor: 'warn',
      });

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'nvmet.namespace.delete',
        [subsystem.namespaces[0].id],
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Namespace deleted.');
      expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalled();
    });
  });
});
