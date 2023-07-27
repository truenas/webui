import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { maxDatasetNesting, maxDatasetPath } from 'app/constants/dataset.constants';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { inherit } from 'app/enums/with-inherit.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetFormService } from 'app/pages/datasets/components/dataset-form/utils/dataset-form.service';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DatasetFormService', () => {
  let spectator: SpectatorService<DatasetFormService>;
  const dataset = {} as Dataset;
  const createService = createServiceFactory({
    service: DatasetFormService,
    providers: [
      mockWebsocket([
        mockCall('pool.dataset.query', [dataset]),
      ]),
      mockProvider(DialogService, {
        warn: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService),
    ],
  });

  beforeEach(() => spectator = createService());

  describe('ensurePathLimits', () => {
    it('checks parent path, shows error if it is too long and closes slide in', async () => {
      const wrongPath = 'a'.repeat(maxDatasetPath);
      await firstValueFrom(spectator.service.ensurePathLimits(wrongPath));

      expect(spectator.inject(DialogService).warn).toHaveBeenCalledWith(
        helptext.pathWarningTitle,
        helptext.pathIsTooLongWarning,
      );
      expect(spectator.inject(IxSlideInService).closeLast).toHaveBeenCalled();
    });

    it('checks parent path, shows error if it nesting level is too deep and closes slide in', async () => {
      const wrongPath = '/'.repeat(maxDatasetNesting);
      await firstValueFrom(spectator.service.ensurePathLimits(wrongPath));

      expect(spectator.inject(DialogService).warn).toHaveBeenCalledWith(
        helptext.pathWarningTitle,
        helptext.pathIsTooDeepWarning,
      );
      expect(spectator.inject(IxSlideInService).closeLast).toHaveBeenCalled();
    });
  });

  describe('loadDataset', () => {
    it('loads dataset by id', async () => {
      const loadedDataset = await firstValueFrom(spectator.service.loadDataset('test'));

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.dataset.query', [[['id', '=', 'test']]]);
      expect(loadedDataset).toEqual(dataset);
    });
  });

  describe('addInheritOption', () => {
    it('takes in observable of options and adds an inherit option with value provided', async () => {
      const options = [
        { label: 'original', value: 'original' },
      ];

      const optionsWithInherit = await firstValueFrom(of(options).pipe(
        spectator.service.addInheritOption('new'),
      ));

      expect(optionsWithInherit).toEqual([
        { label: 'Inherit (new)', value: inherit },
        { label: 'original', value: 'original' },
      ]);
    });
  });
});
