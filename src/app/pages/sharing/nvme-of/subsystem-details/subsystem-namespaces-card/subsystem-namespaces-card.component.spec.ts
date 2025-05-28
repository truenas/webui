import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfNamespace, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  NamespaceDescriptionComponent,
} from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import {
  SubsystemNamespacesCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-namespaces-card/subsystem-namespaces-card.component';

describe('SubsystemNamespacesCardComponent', () => {
  let spectator: Spectator<SubsystemNamespacesCardComponent>;
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
        open: jest.fn(() => of({ id: 7 } as NvmeOfNamespace)),
      }),
      mockProvider(SnackbarService),
      mockProvider(NvmeOfStore, {
        initialize: jest.fn(),
      }),
    ],
  });

  describe('no namespaces', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          subsystem: {
            id: 1,
            namespaces: [],
          } as NvmeOfSubsystemDetails,
        },
      });
    });

    it('shows a warning when subsystem has no namespaces', () => {
      const warning = spectator.query('.no-namespaces-warning');
      expect(warning).toBeTruthy();
      expect(warning.textContent).toContain('No namespaces found for this subsystem.');
      expect(warning).toHaveDescendant('ix-icon');
    });
  });
});
