import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextSystemNtpservers as helptext } from 'app/helptext/system/ntp-servers';
import { CreateNtpServer, NtpServer } from 'app/interfaces/ntp-server.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { FormSubmitEvent, IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { greaterThanFg } from 'app/modules/forms/ix-forms/validators/validators';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-ntp-servers-form',
  templateUrl: './ntp-servers-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    IxFormComponent,
    TranslateModule,
  ],
})
export class NtpServersFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  slideInRef = inject<SlideInRef<NtpServer | undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.NetworkGeneralWrite];

  protected editingServer = this.slideInRef.getData();

  form = this.fb.nonNullable.group({
    address: [''],
    burst: [false],
    iburst: [true],
    prefer: [false],
    minpoll: [6, [Validators.required, Validators.min(4)]],
    maxpoll: [10, [Validators.required, Validators.max(17)]],
    force: [false],
  }, {
    validators: [
      greaterThanFg(
        'maxpoll',
        ['minpoll'],
        this.translate.instant('Value must be greater than {label}', { label: helptext.minpoll.label }),
      ),
    ],
  });

  readonly helptext = helptext;

  protected get title(): string {
    return this.editingServer
      ? this.translate.instant('Edit NTP Server')
      : this.translate.instant('Add NTP Server');
  }

  protected handleSubmit = (event: FormSubmitEvent<CreateNtpServer>): SubmitResult => ({
    request$: this.editingServer
      ? this.api.call('system.ntpserver.update', [this.editingServer.id, event.changedValues])
      : this.api.call('system.ntpserver.create', [event.allValues]),
    successMessage: this.editingServer
      ? this.translate.instant('NTP server updated')
      : this.translate.instant('NTP server added'),
  });
}
