import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Inject,
} from '@angular/core';
import { Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemNtpservers as helptext } from 'app/helptext/system/ntp-servers';
import { CreateNtpServer, NtpServer } from 'app/interfaces/ntp-server.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { greaterThanFg } from 'app/services/validators';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-ntp-server-form',
  templateUrl: './ntp-server-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class NtpServerFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  isFormLoading = false;

  formGroup = this.fb.group({
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

  get isNew(): boolean {
    return !this.editingServer;
  }

  get title(): string {
    return this.isNew ? this.translate.instant('Add NTP Server') : this.translate.instant('Edit NTP Server');
  }

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private errorHandler: FormErrorHandlerService,
    private slideInRef: SlideInRef<NtpServerFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingServer: NtpServer,
  ) {}

  ngOnInit(): void {
    if (this.editingServer) {
      this.setupForm();
    }
  }

  /**
   * @param server Skip argument to add new server.
   */
  setupForm(): void {
    this.formGroup.patchValue({
      address: this.editingServer.address,
      burst: this.editingServer.burst,
      iburst: this.editingServer.iburst,
      prefer: this.editingServer.prefer,
      minpoll: this.editingServer.minpoll,
      maxpoll: this.editingServer.maxpoll,
    });
  }

  onSubmit(): void {
    const values = this.formGroup.value;
    const body: CreateNtpServer = {
      address: values.address,
      burst: values.burst,
      iburst: values.iburst,
      prefer: values.prefer,
      minpoll: values.minpoll,
      maxpoll: values.maxpoll,
      force: values.force,
    };

    this.isFormLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('system.ntpserver.create', [body]);
    } else {
      request$ = this.ws.call('system.ntpserver.update', [this.editingServer.id, body]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.errorHandler.handleWsFormError(error, this.formGroup);
      },
    });
  }
}
