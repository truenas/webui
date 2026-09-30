import { EventUnion } from '@truenas/api-client';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export type PoolScanEvent = EventUnion<WebUiApiDirectory, 'pool.scan'>;

/**
 * The scan a `pool.scan` event reports, or `null` for anything but a change.
 *
 * Middleware sends the scan under `fields`, like every other collection update, but its event
 * model declares `name` and `scan` at the top level, so the generated type has no `fields`
 * (gap 16 in docs/devs/typed-api-client.md). The scan's enums are the UI's reading of the
 * generated literals.
 */
export function poolScanFromEvent(event: PoolScanEvent): PoolScan | null {
  if (event.msg !== 'changed') {
    return null;
  }

  return (event as unknown as { fields: PoolScan }).fields;
}
