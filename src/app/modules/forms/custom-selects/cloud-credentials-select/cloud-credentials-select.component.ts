import { ComponentType } from '@angular/cdk/portal';
import { AsyncPipe } from '@angular/common';
import {
  Component, forwardRef, inject, ChangeDetectionStrategy, input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TnFormFieldComponent, TnSelectComponent } from '@truenas/ui-components';
import { Observable, map } from 'rxjs';
import { CloudSyncProviderName, cloudSyncProviderNameMap } from 'app/enums/cloudsync-provider.enum';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectWithNewOption } from 'app/modules/forms/ix-forms/components/ix-select/ix-select-with-new-option.directive';
import { IxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
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
  imports: [TnFormFieldComponent, TnSelectComponent, ReactiveFormsModule, AsyncPipe],
})
export class CloudCredentialsSelectComponent extends IxSelectWithNewOption<CloudSyncCredential> {
  readonly filterByProviders = input<CloudSyncProviderName[]>();

  private cloudCredentialService = inject(CloudCredentialService);

  fetchOptions(): Observable<Option[]> {
    return this.cloudCredentialService.getCloudSyncCredentials().pipe(
      map((options) => {
        const filterByProviders = this.filterByProviders();
        if (filterByProviders) {
          options = options.filter((option) => filterByProviders.includes(option.provider.type));
        }
        return options.map((option) => {
          return {
            label: ignoreTranslation(`${option.name} (${cloudSyncProviderNameMap.get(option.provider.type)})`),
            value: option.id,
          };
        });
      }),
    );
  }

  getValueFromSlideInResponse(result: CloudSyncCredential): IxSelectValue {
    return result.id;
  }

  getFormComponentType(): ComponentType<CloudCredentialsFormComponent> {
    return CloudCredentialsFormComponent;
  }

  getFormTitle(): string {
    return this.translateService.instant('Add Cloud Credential');
  }

  override getFormInputData(): { editInput: { providers: CloudSyncProviderName[] } } | undefined {
    const providers = this.filterByProviders();
    return providers?.length ? { editInput: { providers } } : undefined;
  }
}
