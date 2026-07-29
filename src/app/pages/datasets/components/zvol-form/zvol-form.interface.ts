import { OnOff } from 'app/enums/on-off.enum';
import { WithInherit } from 'app/enums/with-inherit.enum';

/**
 * Form-value shape for the zvol add/edit form.
 *
 * Update-payload caveat: `special_small_block_size` set to `inherit` is
 * intentionally dropped from the update payload rather than sent as the
 * 'INHERIT' sentinel. The zvol UI has always stripped it on create, and the
 * zvol update endpoint treats an omitted key as "leave inherited" on its
 * side. If the server ever grows a distinction between "still inherit" and
 * "no change", the build-edit-payload path in `ZvolFormComponent` must start
 * sending `inherit` explicitly (as `DatasetFormComponent` already does) —
 * otherwise explicit → inherit transitions would silently no-op.
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
  algorithm?: string;
  type?: string;
  encryption_options?: {
    generate_key?: boolean;
    pbkdf2iters?: number;
    algorithm?: string;
    passphrase?: string;
    key?: string;
  };
}
