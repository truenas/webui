import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { helptext_system_ntpservers as helptext } from 'app/helptext/system/ntp-servers';
import { CreateNtpServer, NtpServer } from 'app/interfaces/ntp-server.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { ValidationService, WebSocketService, DialogService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';

@UntilDestroy()
@Component({
  selector: 'app-ntpserver-form',
  templateUrl: './ntp-server-form.component.html',
  styleUrls: ['./ntp-server-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NtpServerFormComponent {
  title = helptext.header;
  isFormLoading = false;

  formGroup = this.fb.group({
    address: [''],
    burst: [false],
    iburst: [true],
    prefer: [false],
    minpoll: [6, [Validators.required, Validators.min(4)]],
    maxpoll: [10, [Validators.required, Validators.max(17), this.validationService.greaterThan('minpoll', [helptext.minpoll.label])]],
    force: [false],
  });

  readonly helptext = helptext;
  private editingServer: NtpServer;
  get isNew(): boolean {
    return !this.editingServer;
  }

  constructor(
    private modalService: IxModalService,
    private validationService: ValidationService,
    private dialogService: DialogService,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  /**
   * @param server Skip argument to add new server.
   */
  setupForm(server?: NtpServer): void {
    this.editingServer = server;
    if (!this.isNew) {
      this.formGroup.patchValue({
        address: server.address,
        burst: server.burst,
        iburst: server.iburst,
        prefer: server.prefer,
        minpoll: server.minpoll,
        maxpoll: server.maxpoll,
      });
    }
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

    request$.pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.cdr.markForCheck();
      this.modalService.close();
    }, (error) => {
      this.isFormLoading = false;
      this.cdr.markForCheck();
      new EntityUtils().handleWSError(this, error, this.dialogService);
    });
  }
}
