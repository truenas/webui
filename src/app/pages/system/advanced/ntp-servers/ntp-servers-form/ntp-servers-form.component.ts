import {
  Component, ChangeDetectionStrategy, DestroyRef, OnInit, signal, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemNtpservers as helptext } from 'app/helptext/system/ntp-servers';
import { CreateNtpServer, NtpServer } from 'app/interfaces/ntp-server.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { greaterThanFg } from 'app/modules/forms/ix-forms/validators/validators';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-ntp-servers-form',
  templateUrl: './ntp-servers-form.component.html',
  styleUrls: ['./ntp-servers-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class NtpServersFormComponent extends SidePanelForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private errorHandler = inject(FormErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.NetworkGeneralWrite];
  protected readonly InputType = InputType;

  protected isFormLoading = signal(false);
  protected editingServer: NtpServer | undefined;

  /**
   * Row to edit when hosted in a `<tn-side-panel>` (which has no `SlideInRef` to
   * carry data). Absent for Add, and unused in the legacy SlideIn host (which
   * supplies the row via `slideInRef.getData()`).
   */
  readonly editServer = input<NtpServer | undefined>(undefined);

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

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  readonly helptext = helptext;

  get isNew(): boolean {
    return !this.editingServer;
  }

  get title(): string {
    return this.isNew ? this.translate.instant('Add NTP Server') : this.translate.instant('Edit NTP Server');
  }

  ngOnInit(): void {
    this.editingServer = this.slideInRef
      ? this.slideInRef.getData() as NtpServer | undefined
      : this.editServer();
    if (this.editingServer) {
      this.setupForm(this.editingServer);
    }
  }

  /**
   * @param server Skip argument to add new server.
   */
  protected setupForm(server: NtpServer): void {
    this.form.patchValue({
      address: server.address,
      burst: server.burst,
      iburst: server.iburst,
      prefer: server.prefer,
      minpoll: server.minpoll,
      maxpoll: server.maxpoll,
    });
  }

  protected onSubmit(): void {
    const values = this.form.getRawValue();
    const body: CreateNtpServer = {
      address: values.address,
      burst: values.burst,
      iburst: values.iburst,
      prefer: values.prefer,
      minpoll: values.minpoll,
      maxpoll: values.maxpoll,
      force: values.force,
    };

    this.isFormLoading.set(true);
    let request$: Observable<unknown>;
    if (this.editingServer) {
      request$ = this.api.call('system.ntpserver.update', [this.editingServer.id, body]);
    } else {
      request$ = this.api.call('system.ntpserver.create', [body]);
    }

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
