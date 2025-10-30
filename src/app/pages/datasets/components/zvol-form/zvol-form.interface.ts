import { WithInherit } from 'app/enums/with-inherit.enum';

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
  special_small_block_size?: WithInherit<'ON' | 'OFF'> | number;
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
