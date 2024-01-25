import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';

export const cloudsyncProviderDescriptionMap = new Map<CloudSyncProviderName, string>([
  [CloudSyncProviderName.Storj, T('Storj is a decentralized, open-source cloud storage platform. It uses blockchain technology and cryptography to secure files. Instead of storing files in a centralized server, Storj splits up files, encrypts them, and distributes them across a network of computers around the world.')],
]);
