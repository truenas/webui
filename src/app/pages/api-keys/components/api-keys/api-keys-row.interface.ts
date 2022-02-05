import { ApiKey } from 'app/interfaces/api-key.interface';

export type ApiKeysRow = ApiKey & { created_time: string };
