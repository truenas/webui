import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudSyncProviderDescriptionComponent } from './cloudsync-provider-description.component';

describe('CloudSyncProviderDescriptionComponent', () => {
  let spectator: Spectator<CloudSyncProviderDescriptionComponent>;
  const createComponent = createComponentFactory({
    component: CloudSyncProviderDescriptionComponent,
    imports: [ImgFallbackModule],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should have the correct details for Storj', () => {
    spectator.setInput('provider', CloudSyncProviderName.Storj);

    expect(spectator.component.image).toBe('/assets/images/cloudsync/STORJ_IX.png');
    expect(spectator.component.name).toBe('Storj');
    expect(spectator.component.description).toBe('Storj is a decentralized, open-source cloud storage platform. It uses blockchain technology and cryptography to secure files. Instead of storing files in a centralized server, Storj splits up files, encrypts them, and distributes them across a network of computers around the world.');
  });
});
