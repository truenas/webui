import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
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
    spectator = createComponent({
      props: {
        provider: CloudSyncProviderName.Storj,
      },
    });
  });

  it('should have the correct details for Storj', () => {
    spectator.setInput('provider', CloudSyncProviderName.Storj);

    const image = spectator.query('.image img');
    expect(image).toHaveAttribute('src', '/assets/images/cloudsync/STORJ_IX.png');

    const name = spectator.query('.name');
    expect(name).toHaveText('Storj');

    const description = spectator.query('.body');
    expect(description.innerHTML).toContain('Storj is an S3 compatible');
    expect(description.innerHTML).toContain('<a href="https://truenas.com/storj" target="_blank">TrueNAS and Storj</a>');
  });
});
