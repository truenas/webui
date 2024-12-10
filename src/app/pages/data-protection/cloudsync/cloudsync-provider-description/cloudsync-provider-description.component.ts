import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
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
  readonly provider = input.required<CloudSyncProviderName>();

  readonly imagePlaceholder = appImagePlaceholder;

  protected readonly image = computed(() => {
    return `/assets/images/cloudsync/${this.provider()}.png`;
  });

  protected readonly name = computed(() => {
    return cloudSyncProviderNameMap.get(this.provider());
  });

  protected readonly description = computed(() => {
    return cloudsyncProviderDescriptionMap.get(this.provider());
  });
}
