import { JobResult } from '@truenas/api-client';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

/** A pool `pool.import_find` offers to import. */
export type PoolFindResult = JobResult<WebUiApiDirectory, 'pool.import_find'>[number];
