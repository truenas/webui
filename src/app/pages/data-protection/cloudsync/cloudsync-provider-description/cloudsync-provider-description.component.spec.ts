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
    expect(spectator.component.description).toBe('StorJ is an S3 compatible, fault tolerant, globally distributed cloud storage platform with a security first approach to backup and recovery - delivering extreme resilience and performance both sustainably and economically. <a href="https://truenas.com/storj" target="_blank">TrueNAS and Storj</a> have partnered to streamline delivery of Hybrid Cloud solutions globally.');
  });
});
