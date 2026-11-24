import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { ServiceName } from 'app/enums/service-name.enum';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IscsiService } from 'app/services/iscsi.service';
import { ServiceStopConfirmationService } from 'app/services/service-stop-confirmation.service';

describe('ServiceStopConfirmationService', () => {
  let spectator: SpectatorService<ServiceStopConfirmationService>;

  const createService = createServiceFactory({
    service: ServiceStopConfirmationService,
    providers: [
      mockProvider(DialogService, { confirm: jest.fn(() => of(true)) }),
      mockProvider(IscsiService, { getGlobalSessions: jest.fn(() => of([] as IscsiGlobalSession[])) }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('asks whether to stop the service and returns the answer', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValueOnce(of(false));

    expect(await firstValueFrom(spectator.service.confirmStop(ServiceName.S3))).toBe(false);
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      message: 'Are you sure you want to stop S3?',
      hideCheckbox: true,
      buttonColor: 'warn',
      buttonText: 'Stop',
    });
  });

  it('asks to stop iSCSI without a warning when it has no connections', async () => {
    expect(await firstValueFrom(spectator.service.confirmStop(ServiceName.Iscsi))).toBe(true);
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Stop iSCSI?',
    }));
  });

  it('warns about active connections before stopping iSCSI', async () => {
    jest.spyOn(spectator.inject(IscsiService), 'getGlobalSessions').mockReturnValueOnce(
      of([{}, {}] as IscsiGlobalSession[]),
    );

    await firstValueFrom(spectator.service.confirmStop(ServiceName.Iscsi));

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Stop the iSCSI service and close these connections?'),
    }));
  });
});
