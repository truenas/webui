import { ComponentType } from '@angular/cdk/portal';
import {
  Component, Input, forwardRef, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { CloudSyncProviderName, cloudSyncProviderNameMap } from 'app/enums/cloudsync-provider.enum';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectWithNewOption } from 'app/modules/forms/ix-forms/components/ix-select/ix-select-with-new-option.directive';
import { IxSelectComponent, IxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { ChainedComponentResponse } from 'app/services/chained-slide-in.service';
import { CloudCredentialService } from 'app/services/cloud-credential.service';

@Component({
  selector: 'ix-cloud-credentials-select',
  templateUrl: './cloud-credentials-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CloudCredentialsSelectComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IxSelectComponent],
})
export class CloudCredentialsSelectComponent extends IxSelectWithNewOption {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() filterByProviders: CloudSyncProviderName[];

  private cloudCredentialService = inject(CloudCredentialService);

  fetchOptions(): Observable<Option[]> {
    return this.cloudCredentialService.getCloudSyncCredentials().pipe(
      map((options) => {
        if (this.filterByProviders) {
          options = options.filter((option) => this.filterByProviders.includes(option.provider));
        }
        return options.map((option) => {
          return { label: `${option.name} (${cloudSyncProviderNameMap.get(option.provider)})`, value: option.id };
        });
      }),
    );
  }

  getValueFromChainedResponse(result: ChainedComponentResponse<CloudCredential>): IxSelectValue {
    return result.response.id;
  }

  getFormComponentType(): ComponentType<CloudCredentialsFormComponent> {
    return CloudCredentialsFormComponent;
  }

  override getFormInputData(): { providers: CloudSyncProviderName[] } {
    return this.filterByProviders?.length ? { providers: this.filterByProviders } : undefined;
  }
}
