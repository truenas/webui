import { ComponentType } from '@angular/cdk/portal';
import {
  Component, Input, forwardRef, inject,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectWithNewOption } from 'app/modules/ix-forms/components/ix-select/ix-select-with-new-option.directive';
import { CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { ChainedSlideInCloseResponse } from 'app/services/ix-chained-slide-in.service';

@Component({
  selector: 'ix-credentials-select',
  templateUrl: './credentials-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CredentialsSelectComponent),
      multi: true,
    },
  ],
})
export class CredentialsSelectComponent extends IxSelectWithNewOption {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() required: boolean;

  private cloudCredentialService = inject(CloudCredentialService);

  fetchUpdatedOptions(): Observable<Option[]> {
    return this.cloudCredentialService.getCloudsyncCredentials().pipe(
      map((options) => {
        return options.map((option) => {
          return { label: `${option.name} (${option.provider})`, value: option.id };
        });
      }),
    );
  }

  setValueFromSlideInResult(
    result: ChainedSlideInCloseResponse,
    valueSetterCallBack: (value: number) => void,
  ): void {
    valueSetterCallBack((result.response as CloudCredential).id);
  }

  getFormComponentType(): ComponentType<unknown> {
    return CloudCredentialsFormComponent;
  }
}
