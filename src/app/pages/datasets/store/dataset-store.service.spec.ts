import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { take } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { Dataset, DatasetDetails } from 'app/interfaces/dataset.interface';
import { DatasetTreeState, DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { WebSocketService } from 'app/services';

describe('DatasetTreeStore', () => {
  let spectator: SpectatorService<DatasetTreeStore>;
  let testScheduler: TestScheduler;
  const datasets = [
    { id: 'parent' },
    { id: 'parent/child' },
  ] as Dataset[];
  const datasetDetails = [
    { id: 'pool1' },
    { id: 'pool2' },
  ] as DatasetDetails[];
  const createService = createServiceFactory({
    service: DatasetTreeStore,
    providers: [
      mockProvider(WebSocketService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('loads datasets and sets loading indicators when loadDatasets is called', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const mockWebsocket = spectator.inject(WebSocketService);
      jest.spyOn(mockWebsocket, 'call').mockReturnValue(cold('-b|', { b: datasets }));

      spectator.service.loadDatasets();

      expect(mockWebsocket.call).toHaveBeenCalledWith('pool.dataset.details');
      expectObservable(spectator.service.state$).toBe('ab', {
        a: {
          error: null,
          errorDetails: null,
          isLoading: true,
          isLoadingDetails: false,
          selectedDatasetId: null,
          datasets: [],
          datasetDetails: [],
        },
        b: {
          error: null,
          errorDetails: null,
          isLoading: false,
          isLoadingDetails: false,
          selectedDatasetId: null,
          datasets,
          datasetDetails: [],
        },
      });
    });
  });

  it('loads datasets details and sets loading indicators when loadDatasetDetails is called', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const mockWebsocket = spectator.inject(WebSocketService);
      jest.spyOn(mockWebsocket, 'call').mockReturnValue(cold('-b|', { b: datasetDetails }));

      spectator.service.loadDatasetDetails();

      expect(mockWebsocket.call).toHaveBeenCalledWith('pool.dataset.details');
      expectObservable(spectator.service.state$).toBe('ab', {
        a: {
          error: null,
          errorDetails: null,
          isLoading: false,
          isLoadingDetails: true,
          selectedDatasetId: null,
          datasets: [],
          datasetDetails: [],
        },
        b: {
          error: null,
          errorDetails: null,
          isLoading: false,
          isLoadingDetails: false,
          selectedDatasetId: null,
          datasets: [],
          datasetDetails,
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
            errorDetails: null,
            isLoading: false,
            isLoadingDetails: false,
            selectedDatasetId: 'parent/child',
            datasets: [],
            datasetDetails: [],
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
                children: [
                  { id: 'parent1/child2/child1' },
                ],
              },
            ],
          },
        ] as DatasetDetails[],
        selectedDatasetId: 'parent1/child2/child1',
      } as DatasetTreeState);

      const selectedBranch = await spectator.service.selectedBranch$.pipe(take(1)).toPromise();
      expect(selectedBranch).toEqual([
        expect.objectContaining({ id: 'parent1' }),
        expect.objectContaining({ id: 'parent1/child2' }),
        expect.objectContaining({ id: 'parent1/child2/child1' }),
      ]);
    });
  });
});
