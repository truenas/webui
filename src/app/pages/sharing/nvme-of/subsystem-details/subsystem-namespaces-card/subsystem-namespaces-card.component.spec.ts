import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfNamespace, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { NamespaceDescriptionComponent } from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { DeleteNamespaceDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-namespaces-card/delete-namespace-dialog/delete-namespace-dialog.component';
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
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        } as MatDialogRef<unknown>)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null as string | null })),
      }),
      mockProvider(NvmeOfStore, {
        initialize: jest.fn(),
      }),
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
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
    const namespaces = [
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
    ] as NvmeOfNamespace[];

    beforeEach(() => {
      initComponent({
        name: 'Test Subsystem',
        namespaces,
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

    it('opens delete namespace dialog when delete button is pressed', async () => {
      const deleteButton = await loader.getHarness(IxIconHarness.with({ name: 'mdi-delete' }));
      await deleteButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        DeleteNamespaceDialogComponent,
        {
          data: namespaces[0],
        },
      );
      expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalled();
    });
  });
});
