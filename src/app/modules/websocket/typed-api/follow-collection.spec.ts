import { of, Subject } from 'rxjs';
import { followCollection } from 'app/modules/websocket/typed-api/follow-collection';

interface Row {
  id: number;
  name: string;
  status?: string;
}

describe('followCollection', () => {
  const rows: Row[] = [{ id: 1, name: 'tank' }, { id: 2, name: 'dozer' }];
  let changes$: Subject<{ msg: string; id?: unknown; fields?: Row }>;
  let emissions: Row[][];

  beforeEach(() => {
    changes$ = new Subject();
    emissions = [];
    followCollection(of(rows), changes$).subscribe((current) => emissions.push(current));
  });

  it('emits the queried rows first', () => {
    expect(emissions).toEqual([rows]);
  });

  it('appends an added row', () => {
    changes$.next({ msg: 'added', id: 3, fields: { id: 3, name: 'boot-pool' } });

    expect(emissions.at(-1)).toEqual([...rows, { id: 3, name: 'boot-pool' }]);
  });

  it('merges a changed row over the existing one', () => {
    changes$.next({ msg: 'changed', id: 1, fields: { status: 'DEGRADED' } as Row });

    expect(emissions.at(-1)).toEqual([{ id: 1, name: 'tank', status: 'DEGRADED' }, rows[1]]);
  });

  it('drops a removed row', () => {
    changes$.next({ msg: 'removed', id: 2 });

    expect(emissions.at(-1)).toEqual([rows[0]]);
  });

  it('applies each change to the rows the previous ones left', () => {
    changes$.next({ msg: 'removed', id: 1 });
    changes$.next({ msg: 'changed', id: 2, fields: { id: 2, name: 'renamed' } });

    expect(emissions.at(-1)).toEqual([{ id: 2, name: 'renamed' }]);
  });
});
