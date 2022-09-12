import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { cold } from 'jest-marbles';
import { MyStore } from './my-store';

describe('MyStore', () => {
  let spectator: SpectatorService<MyStore>;
  const createService = createServiceFactory({
    service: MyStore,
  });

  beforeEach(() => {
  });

  it('does not work', () => {
    spectator = createService();
    spectator.service.setPizza(true);
    expect(spectator.service.hasPizza$).toBeObservable(cold('a', { a: true }));
  });
});
