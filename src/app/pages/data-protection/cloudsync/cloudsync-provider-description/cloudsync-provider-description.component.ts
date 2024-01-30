import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { CloudSyncProviderName, cloudSyncProviderNameMap } from 'app/enums/cloudsync-provider.enum';
import { cloudsyncProviderDescriptionMap } from 'app/pages/data-protection/cloudsync/cloudsync-provider-description/cloudsync-provider-description';

@Component({
  selector: 'ix-cloudsync-provider-description',
  templateUrl: './cloudsync-provider-description.component.html',
  styleUrls: ['./cloudsync-provider-description.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ImgFallbackModule],
})
export class CloudSyncProviderDescriptionComponent {
  @Input() provider: CloudSyncProviderName;
  readonly imagePlaceholder = appImagePlaceholder;

  get image(): string {
    return `/assets/images/cloudsync/${this.provider}.png`;
  }

  get name(): string {
    return cloudSyncProviderNameMap.get(this.provider);
  }

  get description(): string {
    return cloudsyncProviderDescriptionMap.get(this.provider);
  }
}
