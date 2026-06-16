/* eslint-disable jest/no-conditional-expect */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import {
  Spectator, createComponentFactory, mockProvider, SpectatorFactory,
} from '@ngneat/spectator/jest';
import { TnDialog, TnIconButtonHarness, TnIconHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { TrueCommandStatus } from 'app/enums/true-command-status.enum';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  TruecommandSignupModalComponent,
} from 'app/modules/truecommand/components/truecommand-signup-modal/truecommand-signup-modal.component';
import { TruecommandStatusModalComponent } from 'app/modules/truecommand/components/truecommand-status-modal/truecommand-status-modal.component';
import { TruecommandButtonComponent } from 'app/modules/truecommand/truecommand-button.component';

function getFakeConfig(overrides: Partial<TrueCommandConfig>): TrueCommandConfig {
  return {
    api_key: null,
    status: TrueCommandStatus.Disabled,
    enabled: false,
    id: 999,
    remote_ip_address: 'remote_ip_address string',
    remote_url: 'remote_url string',
    status_reason: 'status_reason string',
    ...overrides,
  };
}

describe('TruecommandButtonComponent', () => {
  let spectator: Spectator<TruecommandButtonComponent>;
  let loader: HarnessLoader;
  let dialogServiceMock: DialogService;
  let tnDialogMock: TnDialog;

  function createComponentWithData(config: Partial<TrueCommandConfig>): SpectatorFactory<TruecommandButtonComponent> {
    return createComponentFactory({
      component: TruecommandButtonComponent,
      imports: [
        ReactiveFormsModule,
        TruecommandStatusModalComponent,
      ],
      providers: [
        mockApi([
          mockCall('truecommand.config', getFakeConfig(config)),
        ]),
        mockProvider(DialogService, {
          generalDialog: jest.fn(() => of()),
        }),
        mockProvider(TnDialog, {
          open: jest.fn(() => ({
            closed: of(),
          })),
        }),
      ],
    });
  }

  [
    { status: TrueCommandStatus.Disabled, expectedButtonId: '#tc-status', expectedDialogType: 'form' },
    { status: TrueCommandStatus.Connecting, expectedButtonId: '#tc-connecting', expectedDialogType: 'general' },
  ].forEach(({ status, expectedButtonId, expectedDialogType }) => {
    describe(`For status '${status}'`, () => {
      const createComponent = createComponentWithData({ status });

      beforeEach(() => {
        spectator = createComponent();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        dialogServiceMock = spectator.inject(DialogService);
      });

      it(`shows ${expectedButtonId} button with trueconnect icon`, async () => {
        expect(spectator.query(expectedButtonId)).toBeVisible();
        const icon = await loader.getHarness(TnIconHarness.with({ name: 'tn-truecommand-logo-mark' }));
        expect(icon).toBeTruthy();
      });

      it(`shows correct message when user clicks on the ${expectedButtonId} button`, async () => {
        await (await loader.getHarness(TnIconButtonHarness)).click();

        if (expectedDialogType === 'form') {
          expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(TruecommandSignupModalComponent);
        }

        if (expectedDialogType === 'general') {
          expect(dialogServiceMock.generalDialog).toHaveBeenCalledWith(
            expect.objectContaining({
              message: 'Are you sure you want to stop connecting to the TrueCommand Cloud Service?',
            }),
          );
        }
      });

      it(`shows the expected badge for ${status}`, () => {
        const badge = spectator.query<HTMLElement>('ix-status-badge');
        if (status === TrueCommandStatus.Connecting) {
          expect(badge).toExist();
          expect(badge?.style.background).toBe('var(--yellow)');
        } else {
          expect(badge).not.toExist();
        }
      });
    });
  });

  [
    {
      status: TrueCommandStatus.Failed, apiKey: undefined, enabled: false, statusReason: 'Fake Status Reason', expectedButtonId: '#tc-status', expectedDialogType: 'form',
    },
    {
      status: TrueCommandStatus.Failed, apiKey: '123', enabled: true, statusReason: 'Fake Status Reason', expectedButtonId: '#tc-status', expectedDialogType: 'status',
    },
    {
      status: TrueCommandStatus.Connected, apiKey: '123', enabled: true, statusReason: 'Fake Status Reason', expectedButtonId: '#tc-status', expectedDialogType: 'status',
    },
    {
      // api_key is redacted by the middleware but TrueCommand is connected
      status: TrueCommandStatus.Connected, apiKey: null, enabled: true, statusReason: 'Fake Status Reason', expectedButtonId: '#tc-status', expectedDialogType: 'status',
    },
  ].forEach(({
    status, apiKey, enabled, statusReason, expectedButtonId, expectedDialogType,
  }) => {
    describe(`For status '${status}' (api_key: ${apiKey}, enabled: ${enabled})`, () => {
      const createComponent = createComponentWithData({
        status, api_key: apiKey, enabled, status_reason: statusReason,
      });

      beforeEach(() => {
        spectator = createComponent();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        dialogServiceMock = spectator.inject(DialogService);

        tnDialogMock = spectator.inject(TnDialog);
        jest.spyOn(tnDialogMock, 'open');
      });

      it(`shows ${expectedButtonId} button with trueconnect icon`, async () => {
        expect(spectator.query(expectedButtonId)).toBeVisible();
        const icon = await loader.getHarness(TnIconHarness.with({ name: 'tn-truecommand-logo-mark' }));
        expect(icon).toBeTruthy();
      });

      it(`shows the expected status badge for status '${status}'`, () => {
        const badge = spectator.query<HTMLElement>('ix-status-badge');
        if (status === TrueCommandStatus.Connected) {
          expect(badge).toExist();
          expect(badge?.style.background).toBe('var(--green)');
        } else if (status === TrueCommandStatus.Failed) {
          expect(badge).toExist();
          expect(badge?.style.background).toBe('var(--red)');
        } else {
          expect(badge).not.toExist();
        }
      });

      it(`shows status modal when user clicks on the ${expectedButtonId} button`, async () => {
        await (await loader.getHarness(TnIconButtonHarness)).click();

        if (expectedDialogType === 'status') {
          expect(tnDialogMock.open).toHaveBeenCalledWith(
            TruecommandStatusModalComponent,
            expect.objectContaining({
              data: expect.objectContaining({
                data: expect.objectContaining({
                  status,
                  api_key: apiKey,
                  status_reason: statusReason,
                }),
              }),
            }),
          );
        }

        if (expectedDialogType === 'form') {
          expect(tnDialogMock.open).toHaveBeenCalledWith(TruecommandSignupModalComponent);
        }
      });
    });
  });
});
