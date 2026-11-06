import { OnOff } from 'app/enums/on-off.enum';
import { WithInherit } from 'app/enums/with-inherit.enum';

/**
 * Form value for the zvol add/edit form. `special_small_block_size: inherit` is dropped from the update
 * payload rather than sent as 'INHERIT', since the endpoint reads an omitted key as "leave inherited".
 * If middleware ever distinguishes the two, `ZvolFormComponent` must send `inherit` explicitly, as
 * `DatasetFormComponent` does, or explicit → inherit changes will silently no-op.
 */
export interface ZvolFormData {
  name?: string;
  comments?: string;
  volsize?: string | number;
  force_size?: boolean;
  sync?: string;
  compression?: string;
  deduplication?: string;
  sparse?: boolean;
  readonly?: string;
  volblocksize?: string;
  snapdev?: string;
  special_small_block_size?: WithInherit<OnOff> | number;
  special_small_block_size_custom?: number | null;
  inherit_encryption?: boolean;
  encryption?: boolean;
  encryption_type?: string;
  generate_key?: boolean;
  key?: string;
  passphrase?: string;
  confirm_passphrase?: string;
  pbkdf2iters?: number;
  type?: string;
  encryption_options?: {
    generate_key?: boolean;
    pbkdf2iters?: number;
    passphrase?: string;
    key?: string;
  };
}
