import { ComponentType } from '@angular/cdk/portal';
import {
  Component, Input, forwardRef, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { cloudSyncProviderNameMap } from 'app/enums/cloudsync-provider.enum';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectWithNewOption } from 'app/modules/ix-forms/components/ix-select/ix-select-with-new-option.directive';
import { IxSelectValue } from 'app/modules/ix-forms/components/ix-select/ix-select.component';
import { CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { ChainedComponentResponse } from 'app/services/ix-chained-slide-in.service';

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
})
export class CloudCredentialsSelectComponent extends IxSelectWithNewOption {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() required: boolean;

  private cloudCredentialService = inject(CloudCredentialService);

  fetchOptions(): Observable<Option[]> {
    return this.cloudCredentialService.getCloudSyncCredentials().pipe(
      map((options) => {
        return options.map((option) => {
          return { label: `${option.name} (${cloudSyncProviderNameMap.get(option.provider)})`, value: option.id };
        });
      }),
    );
  }

  getValueFromChainedResponse(
    result: ChainedComponentResponse,
  ): IxSelectValue {
    return (result.response as CloudCredential).id;
  }

  getFormComponentType(): ComponentType<unknown> {
    return CloudCredentialsFormComponent;
  }
}
