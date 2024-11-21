import { of } from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEventTyped } from 'app/interfaces/api-message.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { applyApiEvent } from './apply-api-event.operator';

describe('applyApiEvent', () => {
  it('adds an item when an Added event is received', () => {
    const items = [{ id: 1 } as Pool];
    const event = {
      msg: CollectionChangeType.Added,
      fields: { id: 2 } as Pool,
    } as ApiEventTyped<'pool.query'>;

    applyApiEvent()(of([items, event])).subscribe((result) => {
      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    });
  });

  it('updates an item when a Changed event is received', () => {
    const items = [{ id: 1, name: 'pool1' } as Pool];
    const event = {
      msg: CollectionChangeType.Added,
      fields: { id: 1, name: 'pool2' } as Pool,
    } as ApiEventTyped<'pool.query'>;

    applyApiEvent()(of([items, event])).subscribe((result) => {
      expect(result).toEqual([{ id: 1, name: 'pool2' }]);
    });
  });

  it('removes an item when a Removed event is received', () => {
    const items = [{ id: 1, name: 'pool1' }, { id: 2, name: 'pool2' }] as Pool[];
    const event = {
      msg: CollectionChangeType.Removed,
      id: 1,
    } as ApiEventTyped<'pool.query'>;

    applyApiEvent()(of([items, event])).subscribe((result) => {
      expect(result).toEqual([{ id: 2, name: 'pool2' }]);
    });
  });
});
