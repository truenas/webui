import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { Dataset, DatasetDetails } from 'app/interfaces/dataset.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DatasetTreeState,
  DatasetTreeStore,
} from 'app/pages/datasets/store/dataset-store.service';

describe('DatasetTreeStore', () => {
  let spectator: SpectatorService<DatasetTreeStore>;
  let testScheduler: TestScheduler;
  const datasets = [{ id: 'parent' }, { id: 'parent/child' }] as Dataset[];
  const createService = createServiceFactory({
    service: DatasetTreeStore,
    providers: [mockProvider(ApiService)],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = getTestScheduler();
  });

  it('loads datasets and sets loading indicators when loadDatasets is called', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const mockedApi = spectator.inject(ApiService);
      jest
        .spyOn(mockedApi, 'call')
        .mockReturnValue(cold('-b|', { b: datasets }));

      spectator.service.loadDatasets();

      expect(mockedApi.call).toHaveBeenCalledWith('pool.dataset.details');
      expectObservable(spectator.service.state$).toBe('ab', {
        a: {
          error: null,
          isLoading: true,
          selectedDatasetId: null,
          datasets: [],
        },
        b: {
          error: null,
          isLoading: false,
          selectedDatasetId: null,
          datasets,
        },
      });
    });
  });

  describe('selectDatasetById', () => {
    it('updates selectedDatasetId in state', () => {
      testScheduler.run(({ expectObservable }) => {
        spectator.service.selectDatasetById('parent/child');
        expectObservable(spectator.service.state$).toBe('a', {
          a: {
            error: null,
            isLoading: false,
            selectedDatasetId: 'parent/child',
            datasets: [],
          },
        });
      });
    });
  });

  describe('selectedBranch$', () => {
    it('returns an array of datasets going from parent to child matching selected id', async () => {
      spectator.service.setState({
        datasets: [
          {
            id: 'parent1',
            children: [
              { id: 'parent1/child1' },
              {
                id: 'parent1/child2',
                children: [{ id: 'parent1/child2/child1' }],
              },
            ],
          },
        ] as DatasetDetails[],
        selectedDatasetId: 'parent1/child2/child1',
      } as DatasetTreeState);

      const selectedBranch = await firstValueFrom(
        spectator.service.selectedBranch$,
      );
      expect(selectedBranch).toEqual([
        expect.objectContaining({ id: 'parent1' }),
        expect.objectContaining({ id: 'parent1/child2' }),
        expect.objectContaining({ id: 'parent1/child2/child1' }),
      ]);
    });
  });

  describe('selectedDataset$', () => {
    it('returns null when isLoading is true to prevent stale data', async () => {
      spectator.service.setState({
        datasets: [
          {
            id: 'parent1',
            children: [{ id: 'parent1/child1' }],
          },
        ] as DatasetDetails[],
        selectedDatasetId: 'parent1/child1',
        isLoading: true,
      } as DatasetTreeState);

      const selectedDataset = await firstValueFrom(
        spectator.service.selectedDataset$,
      );
      expect(selectedDataset).toBeNull();
    });

    it('returns the selected dataset when isLoading is false', async () => {
      spectator.service.setState({
        datasets: [
          {
            id: 'parent1',
            children: [{ id: 'parent1/child1' }],
          },
        ] as DatasetDetails[],
        selectedDatasetId: 'parent1/child1',
        isLoading: false,
      } as DatasetTreeState);

      const selectedDataset = await firstValueFrom(
        spectator.service.selectedDataset$,
      );
      expect(selectedDataset).toEqual(
        expect.objectContaining({ id: 'parent1/child1' }),
      );
    });
  });

  describe('selectedParentDataset$', () => {
    it('returns null when isLoading is true to prevent stale data', async () => {
      spectator.service.setState({
        datasets: [
          {
            id: 'parent1',
            children: [{ id: 'parent1/child1' }],
          },
        ] as DatasetDetails[],
        selectedDatasetId: 'parent1/child1',
        isLoading: true,
      } as DatasetTreeState);

      const selectedParentDataset = await firstValueFrom(
        spectator.service.selectedParentDataset$,
      );
      expect(selectedParentDataset).toBeNull();
    });

    it('returns the parent dataset when isLoading is false', async () => {
      spectator.service.setState({
        datasets: [
          {
            id: 'parent1',
            children: [{ id: 'parent1/child1' }],
          },
        ] as DatasetDetails[],
        selectedDatasetId: 'parent1/child1',
        isLoading: false,
      } as DatasetTreeState);

      const selectedParentDataset = await firstValueFrom(
        spectator.service.selectedParentDataset$,
      );
      expect(selectedParentDataset).toEqual(
        expect.objectContaining({ id: 'parent1' }),
      );
    });
  });
});
