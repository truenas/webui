import { ComponentType } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component, Input, forwardRef, inject,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { Option } from 'app/interfaces/option.interface';
import { SshCredentials } from 'app/interfaces/ssh-credentials.interface';
import { IxSelectWithNewOption } from 'app/modules/forms/ix-forms/components/ix-select/ix-select-with-new-option.directive';
import { IxSelectComponent, IxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { ChainedComponentResponse } from 'app/services/chained-slide-in.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';

@Component({
  selector: 'ix-ssh-credentials-select',
  templateUrl: './ssh-credentials-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SshCredentialsSelectComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IxSelectComponent],
})
export class SshCredentialsSelectComponent extends IxSelectWithNewOption {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() required: boolean;

  private keychainCredentialsService = inject(KeychainCredentialService);

  fetchOptions(): Observable<Option[]> {
    return this.keychainCredentialsService.getSshConnections().pipe(
      idNameArrayToOptions(),
    );
  }

  getValueFromChainedResponse(result: ChainedComponentResponse<SshCredentials>): IxSelectValue {
    return result.response.id;
  }

  getFormComponentType(): ComponentType<SshConnectionFormComponent> {
    return SshConnectionFormComponent;
  }
}
