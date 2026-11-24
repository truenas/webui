import { createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { maxDatasetNesting, maxDatasetPath } from 'app/constants/dataset.constants';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { inherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetFormService } from 'app/pages/datasets/components/dataset-form/utils/dataset-form.service';
import { ZfsResourceEntry } from 'app/services/dataset/zfs-resource.utils';

describe('DatasetFormService', () => {
  const row = {
    name: 'test',
    pool: 'test',
    type: 'FILESYSTEM',
    properties: {
      compression: { raw: 'lz4', value: 'lz4', source: { type: 'LOCAL', value: null } },
    },
    user_properties: {},
    children: null,
  } as unknown as ZfsResourceEntry;
  const createService = createServiceFactory({
    service: DatasetFormService,
    providers: [
      mockApi([
        mockCall('zfs.resource.list', [row]),
      ]),
      mockProvider(DialogService),
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

      expect(api.call).toHaveBeenCalledWith('zfs.resource.list', [expect.objectContaining({
        paths: ['test'],
        get_source: true,
        get_user_properties: true,
      })]);
      expect(loadedDataset).toEqual(expect.objectContaining({
        id: 'test',
        name: 'test',
        compression: {
          parsed: 'lz4', rawvalue: 'lz4', value: 'LZ4', source: ZfsPropertySource.Local,
        },
      }));
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

    it('converts uppercase enum values to title case', async () => {
      const options = [
        { label: 'On', value: 'ON' },
        { label: 'Off', value: 'OFF' },
      ];

      const optionsWithInherit = await firstValueFrom(of(options).pipe(
        spectator.service.addInheritOption('OFF'),
      ));

      expect(optionsWithInherit).toEqual([
        { label: 'Inherit (Off)', value: inherit },
        { label: 'On', value: 'ON' },
        { label: 'Off', value: 'OFF' },
      ]);
    });

    it('does not convert values that are not in the whitelist', async () => {
      const options = [
        { label: '128K', value: '128K' },
        { label: '256K', value: '256K' },
      ];

      const optionsWithInherit = await firstValueFrom(of(options).pipe(
        spectator.service.addInheritOption('128K'),
      ));

      expect(optionsWithInherit).toEqual([
        { label: 'Inherit (128K)', value: inherit },
        { label: '128K', value: '128K' },
        { label: '256K', value: '256K' },
      ]);
    });
  });
});
