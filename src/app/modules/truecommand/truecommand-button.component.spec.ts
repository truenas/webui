/* eslint-disable jest/no-conditional-expect */
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  Spectator, createComponentFactory, mockProvider, SpectatorFactory,
} from '@ngneat/spectator/jest';
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
  let dialogServiceMock: DialogService;
  let matDialogMock: MatDialog;

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
        mockProvider(MatDialog, {
          open: jest.fn(() => ({
            afterClosed: jest.fn(() => of()),
          })),
        }),
        mockProvider(MatDialogRef),
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

        dialogServiceMock = spectator.inject(DialogService);
      });

      it(`shows ${expectedButtonId} button with trueconnect icon`, () => {
        expect(spectator.query(expectedButtonId)).toBeVisible();
        expect(spectator.query(`${expectedButtonId} [name="ix-truecommand-logo-mark"]`)).toBeVisible();
      });

      it(`shows correct message when user clicks on the ${expectedButtonId} button`, () => {
        spectator.click(spectator.query(expectedButtonId)!);

        if (expectedDialogType === 'form') {
          expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(TruecommandSignupModalComponent);
        }

        if (expectedDialogType === 'general') {
          expect(dialogServiceMock.generalDialog).toHaveBeenCalledWith(
            expect.objectContaining({
              message: 'Are you sure you want to stop connecting to the TrueCommand Cloud Service?',
            }),
          );
        }
      });
    });
  });

  [
    {
      status: TrueCommandStatus.Failed, apiKey: undefined, statusReason: 'Fake Status Reason', expectedButtonId: '#tc-status', expectedDialogType: 'form',
    },
    {
      status: TrueCommandStatus.Failed, apiKey: '123', statusReason: 'Fake Status Reason', expectedButtonId: '#tc-status', expectedDialogType: 'status',
    },
    {
      status: TrueCommandStatus.Connected, apiKey: '123', statusReason: 'Fake Status Reason', expectedButtonId: '#tc-status', expectedDialogType: 'status',
    },
  ].forEach(({
    status, apiKey, statusReason, expectedButtonId, expectedDialogType,
  }) => {
    describe(`For status '${status}'`, () => {
      const createComponent = createComponentWithData({ status, api_key: apiKey, status_reason: statusReason });

      beforeEach(() => {
        spectator = createComponent();

        dialogServiceMock = spectator.inject(DialogService);

        matDialogMock = spectator.inject(MatDialog);
        jest.spyOn(matDialogMock, 'open');
      });

      it(`shows ${expectedButtonId} button with trueconnect icon`, () => {
        expect(spectator.query(expectedButtonId)).toBeVisible();
        expect(spectator.query(`${expectedButtonId} [name="ix-truecommand-logo-mark"]`)).toBeVisible();
      });

      it(`shows status modal when user clicks on the ${expectedButtonId} button`, () => {
        spectator.click(spectator.query(expectedButtonId)!);

        if (expectedDialogType === 'status') {
          expect(matDialogMock.open).toHaveBeenCalledWith(
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
          expect(matDialogMock.open).toHaveBeenCalledWith(TruecommandSignupModalComponent);
        }
      });
    });
  });
});
