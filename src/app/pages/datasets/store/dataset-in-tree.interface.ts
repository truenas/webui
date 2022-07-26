import { Dataset } from 'app/interfaces/dataset.interface';

/**
 * Not all properties are loaded for datasets shown in the tree.
 */
export type DatasetInTree = Pick<Dataset,
| 'id'
| 'available'
| 'children'
| 'encrypted'
| 'encryption_algorithm'
| 'encryption_root'
| 'key_format'
| 'key_loaded'
| 'locked'
| 'mountpoint'
| 'name'
| 'pool'
| 'type'
| 'used'
| 'quota'
>;
