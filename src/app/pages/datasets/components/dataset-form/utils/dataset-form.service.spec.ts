import { createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { maxDatasetNesting, maxDatasetPath } from 'app/constants/dataset.constants';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { inherit } from 'app/enums/with-inherit.enum';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetFormService } from 'app/pages/datasets/components/dataset-form/utils/dataset-form.service';

describe('DatasetFormService', () => {
  const dataset = {} as Dataset;
  const createService = createServiceFactory({
    service: DatasetFormService,
    providers: [
      mockApi([
        mockCall('pool.dataset.query', [dataset]),
      ]),
      mockProvider(DialogService),
      mockProvider(SlideIn),
    ],
  });

  let spectator: ReturnType<typeof createService>;
  let service: DatasetFormService;
  let dialogService: DialogService;
  let api: ApiService;

  beforeEach(() => {
    spectator = createService();
    service = spectator.service as DatasetFormService;
    dialogService = spectator.inject(DialogService);
    api = spectator.inject(ApiService);
    jest.spyOn(dialogService, 'warn').mockReturnValue(of(true));
  });

  describe('ensurePathLimits', () => {
    it('checks parent path, shows error if it is too long and closes slide in', async () => {
      const wrongPath = 'a'.repeat(maxDatasetPath);
      await firstValueFrom(service.checkAndWarnForLengthAndDepth(wrongPath));

      expect(dialogService.warn).toHaveBeenCalledWith(
        helptextDatasetForm.pathWarningTitle,
        helptextDatasetForm.pathIsTooLongWarning,
      );
    });

    it('checks parent path, shows error if it nesting level is too deep and closes slide in', async () => {
      const wrongPath = '/'.repeat(maxDatasetNesting);
      await firstValueFrom(service.checkAndWarnForLengthAndDepth(wrongPath));

      expect(dialogService.warn).toHaveBeenCalledWith(
        helptextDatasetForm.pathWarningTitle,
        helptextDatasetForm.pathIsTooDeepWarning,
      );
    });
  });

  describe('loadDataset', () => {
    it('loads dataset by id', async () => {
      const loadedDataset = await firstValueFrom(service.loadDataset('test'));

      expect(api.call).toHaveBeenCalledWith('pool.dataset.query', [[['id', '=', 'test']]]);
      expect(loadedDataset).toEqual(dataset);
    });
  });

  describe('addInheritOption', () => {
    it('takes in observable of options and adds an inherit option with value provided', async () => {
      const options = [
        { label: 'original', value: 'original' },
      ];

      const optionsWithInherit = await firstValueFrom(of(options).pipe(
        service.addInheritOption('new'),
      ));

      expect(optionsWithInherit).toEqual([
        { label: 'Inherit (new)', value: inherit },
        { label: 'original', value: 'original' },
      ]);
    });
  });
});
