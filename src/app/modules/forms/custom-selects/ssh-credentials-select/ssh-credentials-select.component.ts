import { ComponentType } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component, forwardRef, inject, input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectWithNewOption } from 'app/modules/forms/ix-forms/components/ix-select/ix-select-with-new-option.directive';
import { IxSelectComponent, IxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
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
  imports: [IxSelectComponent],
})
export class SshCredentialsSelectComponent extends IxSelectWithNewOption<KeychainCredential> {
  readonly label = input<TranslatedString>();
  readonly tooltip = input<TranslatedString>();
  readonly required = input<boolean>(false);

  private keychainCredentialsService = inject(KeychainCredentialService);

  fetchOptions(): Observable<Option[]> {
    return this.keychainCredentialsService.getSshConnections().pipe(
      idNameArrayToOptions(),
    );
  }

  getValueFromSlideInResponse(result: KeychainCredential): IxSelectValue {
    return result.id || null;
  }

  getFormComponentType(): ComponentType<SshConnectionFormComponent> {
    return SshConnectionFormComponent;
  }
}
