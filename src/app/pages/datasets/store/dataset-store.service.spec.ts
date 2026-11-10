import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { NEVER, of, Subject, throwError } from 'rxjs';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';

describe('DatasetTreeStore', () => {
  let spectator: SpectatorService<DatasetTreeStore>;
  let api: ApiService;
  const datasets = [{ id: 'parent' }, { id: 'parent/child' }] as DatasetDetails[];
  const tree = [
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
  ] as DatasetDetails[];

  const createService = createServiceFactory({
    service: DatasetTreeStore,
    providers: [mockProvider(ApiService)],
  });

  /** Each call to `pool.dataset.details` gets the next subject, answered by the test. */
  function mockAnswers(count: number): Subject<DatasetDetails[]>[] {
    const answers = Array.from({ length: count }, () => new Subject<DatasetDetails[]>());
    const mock = jest.spyOn(api, 'call');
    answers.forEach((answer$) => mock.mockReturnValueOnce(answer$));
    return answers;
  }

  function respond(answer$: Subject<DatasetDetails[]>, value: DatasetDetails[]): void {
    answer$.next(value);
    answer$.complete();
  }

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(ApiService);
  });

  it('loads datasets and sets loading indicators when loadDatasets is called', () => {
    const [load$] = mockAnswers(1);

    spectator.service.loadDatasets();

    expect(api.call).toHaveBeenCalledWith('pool.dataset.details');
    expect(spectator.service.isLoading()).toBe(true);
    expect(spectator.service.datasets()).toEqual([]);

    respond(load$, datasets);

    expect(spectator.service.isLoading()).toBe(false);
    expect(spectator.service.error()).toBeNull();
    expect(spectator.service.datasets()).toEqual(datasets);
  });

  it('records the error when a load fails', () => {
    const error = new Error('Network Error');
    jest.spyOn(api, 'call').mockReturnValue(throwError(() => error));

    spectator.service.loadDatasets();

    expect(spectator.service.isLoading()).toBe(false);
    expect(spectator.service.error()).toBe(error);
  });

  describe('refreshDatasets', () => {
    it('replaces the datasets without entering the loading state', () => {
      const [refresh$] = mockAnswers(1);

      spectator.service.refreshDatasets();

      expect(api.call).toHaveBeenCalledWith('pool.dataset.details');
      expect(spectator.service.isLoading()).toBe(false);

      respond(refresh$, datasets);

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.datasets()).toEqual(datasets);
    });

    it('keeps the datasets already shown when the refresh fails', () => {
      const shown = [{ id: 'parent' }] as DatasetDetails[];
      jest.spyOn(api, 'call')
        .mockReturnValueOnce(of(shown))
        .mockReturnValueOnce(throwError(() => new Error('Network Error')));
      spectator.service.loadDatasets();

      spectator.service.refreshDatasets();

      expect(spectator.service.datasets()).toEqual(shown);
      expect(spectator.service.error()).toBeNull();
    });
  });

  it('clears a load error once a later refresh succeeds', () => {
    const loadError = new Error('Network Error');
    jest.spyOn(api, 'call')
      .mockReturnValueOnce(throwError(() => loadError))
      .mockReturnValueOnce(of(datasets));

    spectator.service.loadDatasets();
    expect(spectator.service.error()).toBe(loadError);

    spectator.service.refreshDatasets();
    expect(spectator.service.error()).toBeNull();
    expect(spectator.service.datasets()).toEqual(datasets);
  });

  describe('when a load and a refresh overlap', () => {
    const before = [{ id: 'before' }] as DatasetDetails[];
    const after = [{ id: 'after' }] as DatasetDetails[];

    it('lets a later load cancel an in-flight refresh, so an older answer cannot land last', () => {
      const [refresh$, load$] = mockAnswers(2);

      spectator.service.refreshDatasets();
      spectator.service.loadDatasets();
      respond(load$, after);
      respond(refresh$, before);

      expect(spectator.service.datasets()).toEqual(after);
    });

    it('does not let a refresh cancel a load in flight; it runs once the load has answered', () => {
      const [load$, refresh$] = mockAnswers(2);

      spectator.service.loadDatasets();
      spectator.service.refreshDatasets();
      expect(api.call).toHaveBeenCalledTimes(1);
      expect(spectator.service.isLoading()).toBe(true);

      respond(load$, before);
      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.datasets()).toEqual(before);
      expect(api.call).toHaveBeenCalledTimes(2);

      respond(refresh$, after);
      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.datasets()).toEqual(after);
    });

    it('runs a single follow-up however many refreshes arrive during a fetch', () => {
      const [first$, followUp$] = mockAnswers(2);

      spectator.service.refreshDatasets();
      spectator.service.refreshDatasets();
      spectator.service.refreshDatasets();
      spectator.service.refreshDatasets();
      respond(first$, after);
      respond(followUp$, after);

      // The first, and one more for everything that queued behind it.
      expect(api.call).toHaveBeenCalledTimes(2);
    });

    it('still runs a refresh queued behind a fetch that a load then replaces', () => {
      const [, secondLoad$, refresh$] = mockAnswers(3);

      spectator.service.loadDatasets();
      spectator.service.refreshDatasets();
      spectator.service.loadDatasets();

      respond(secondLoad$, before);
      expect(spectator.service.datasets()).toEqual(before);

      respond(refresh$, after);
      expect(spectator.service.datasets()).toEqual(after);
    });

    it('recovers on the next load from a fetch that is never answered', () => {
      jest.spyOn(api, 'call')
        .mockReturnValueOnce(NEVER)
        .mockReturnValue(of(after));

      spectator.service.refreshDatasets();
      spectator.service.refreshDatasets();
      spectator.service.loadDatasets();
      // The load, and the refresh that had queued behind the fetch it replaced.
      expect(api.call).toHaveBeenCalledTimes(3);

      spectator.service.refreshDatasets();
      expect(api.call).toHaveBeenCalledTimes(4);
    });
  });

  it('reports a failed refresh when there are no datasets on screen to keep', () => {
    const refreshError = new Error('Network Error');
    jest.spyOn(api, 'call').mockReturnValue(throwError(() => refreshError));

    spectator.service.refreshDatasets();

    expect(spectator.service.error()).toBe(refreshError);
  });

  it('resetDatasets clears the datasets and the selection', () => {
    jest.spyOn(api, 'call').mockReturnValue(of(tree));
    spectator.service.loadDatasets();
    spectator.service.selectDatasetById('parent1/child1');

    spectator.service.resetDatasets();

    expect(spectator.service.datasets()).toEqual([]);
    expect(spectator.service.selectedBranch()).toBeNull();
    expect(spectator.service.isLoading()).toBe(false);
  });

  it('datasetUpdated reloads the datasets', () => {
    jest.spyOn(api, 'call').mockReturnValue(of(datasets));

    spectator.service.datasetUpdated();

    expect(api.call).toHaveBeenCalledWith('pool.dataset.details');
    expect(spectator.service.datasets()).toEqual(datasets);
  });

  describe('selection', () => {
    beforeEach(() => {
      jest.spyOn(api, 'call').mockReturnValue(of(tree));
      spectator.service.loadDatasets();
    });

    it('selectedBranch returns the datasets going from parent to child matching selected id', () => {
      spectator.service.selectDatasetById('parent1/child2/child1');

      expect(spectator.service.selectedBranch()).toEqual([
        expect.objectContaining({ id: 'parent1' }),
        expect.objectContaining({ id: 'parent1/child2' }),
        expect.objectContaining({ id: 'parent1/child2/child1' }),
      ]);
    });

    it('selectedBranch is null for an id that is not in the tree', () => {
      spectator.service.selectDatasetById('missing');

      expect(spectator.service.selectedBranch()).toBeNull();
      expect(spectator.service.selectedDataset()).toBeNull();
    });

    it('returns the selected dataset and its parent when not loading', () => {
      spectator.service.selectDatasetById('parent1/child1');

      expect(spectator.service.selectedDataset()).toEqual(expect.objectContaining({ id: 'parent1/child1' }));
      expect(spectator.service.selectedParentDataset()).toEqual(expect.objectContaining({ id: 'parent1' }));
    });

    it('returns null for the selected dataset and its parent while loading, to prevent stale data', () => {
      spectator.service.selectDatasetById('parent1/child1');
      jest.spyOn(api, 'call').mockReturnValue(NEVER);

      spectator.service.loadDatasets();

      expect(spectator.service.selectedDataset()).toBeNull();
      expect(spectator.service.selectedParentDataset()).toBeNull();
      expect(spectator.service.selectedBranch()).toHaveLength(2);
    });
  });
});
