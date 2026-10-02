import { CallParams, v27_0_0 } from '@truenas/api-client';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export type KerberosRealm = v27_0_0.KerberosRealmEntry;

export type KerberosRealmUpdate = CallParams<WebUiApiDirectory, 'kerberos.realm.create'>[0];
