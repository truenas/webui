import { Dataset } from 'app/interfaces/dataset.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';

export const snapshotExcludeBootQueryFilter: QueryFilter<Dataset>[] = [['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']];
