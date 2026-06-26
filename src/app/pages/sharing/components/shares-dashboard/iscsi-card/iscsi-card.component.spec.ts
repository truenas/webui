import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnDialog, TnMenuHarness, TnMenuTesting, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiAuthMethod, IscsiTargetMode } from 'app/enums/iscsi.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { IscsiCardComponent } from 'app/pages/sharing/components/shares-dashboard/iscsi-card/iscsi-card.component';
import {
  ServiceActionsMenuService,
} from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-actions-menu.service';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { DeleteTargetDialog } from 'app/pages/sharing/iscsi/target/delete-target-dialog/delete-target-dialog.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { LicenseService } from 'app/services/license.service';
import { selectServices } from 'app/store/services/services.selectors';

describe('IscsiCardComponent', () => {
  let spectator: Spectator<IscsiCardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  // The "⋮" row-action trigger test id, derived from the row's uniqueRowTag.
  const rowMenuTrigger = '[data-test="button-card-iscsi-target-grow-more-action"]';

  const iscsiShares = [
    {
      id: 6,
      name: 'grow',
      alias: 'kokok',
      mode: IscsiTargetMode.Both,
      auth_networks: [],
      groups: [
        {
          portal: 1,
          initiator: 4,
          auth: null,
          authmethod: IscsiAuthMethod.None,
        },
      ],
    },
  ] as IscsiTarget[];

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: IscsiCardComponent,
    imports: [IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('iscsi.target.query', iscsiShares),
        mockCall('iscsi.target.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(LicenseService, {
        hasFibreChannel$: of(true),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      provideMockStore({
        initialState: {
          alerts: {
            ids: [], entities: {}, isLoading: false, isPanelOpen: false, error: null,
          },
        },
        selectors: [
          {
            selector: selectServices,
            value: [{
              id: 4,
              service: ServiceName.Iscsi,
              state: ServiceStatus.Stopped,
              enable: false,
            } as Service],
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    spectator.click(rowMenuTrigger);
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  it('should render title', () => {
    expect(spectator.query('h3')).toHaveText('Block (iSCSI/FC) Shares Targets');
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Target Name', 'Target Alias', 'Mode', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['grow', 'kokok', 'Both', ''],
    ]);
  });

  it('opens the iSCSI wizard when the projected Wizard button is clicked', async () => {
    const wizardButton = await loader.getHarness(TnButtonHarness.with({ label: 'Wizard' }));
    await wizardButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(IscsiWizardComponent, {
      data: undefined,
      wide: true,
    });
  });

  it('toggles the iSCSI service when the projected header toggle is changed', async () => {
    const toggleState = jest.spyOn(spectator.inject(ServiceActionsMenuService), 'toggleServiceState')
      .mockImplementation(() => {});
    const toggle = await loader.getHarness(
      TnSlideToggleHarness.with({ ancestor: '.tn-card__header-right' }),
    );
    await toggle.toggle();

    expect(toggleState).toHaveBeenCalledWith(expect.objectContaining({ service: ServiceName.Iscsi }));
  });

  it('shows form to edit an existing iSCSI Share when Edit button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: /^Edit$/ });

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(TargetFormComponent, {
      wide: true,
      title: 'Edit ISCSI Target',
      inputs: { targetData: expect.objectContaining(iscsiShares[0]) },
    });
  });

  it('shows confirmation to delete iSCSI Share when Delete button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
      DeleteTargetDialog,
      { data: iscsiShares[0], width: '600px' },
    );
  });
});
