import { ComponentType } from '@angular/cdk/portal';
import {
  Component, Input, forwardRef, inject,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { Option } from 'app/interfaces/option.interface';
import { SshCredentials } from 'app/interfaces/ssh-credentials.interface';
import { IxSelectWithNewOption } from 'app/modules/ix-forms/components/ix-select/ix-select-with-new-option.directive';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { ChainedComponentResponse } from 'app/services/ix-chained-slide-in.service';
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
})
export class SshCredentialsSelectComponent extends IxSelectWithNewOption {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() required: boolean;

  private keyChainCredsService = inject(KeychainCredentialService);

  fetchOptions(): Observable<Option[]> {
    return this.keyChainCredsService.getSshConnections().pipe(
      idNameArrayToOptions(),
    );
  }

  setValueFromSlideInResult(
    result: ChainedComponentResponse,
  ): void {
    this.value = (result.response as SshCredentials).id;
  }

  getFormComponentType(): ComponentType<unknown> {
    return SshConnectionFormComponent;
  }
}
