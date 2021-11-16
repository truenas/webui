import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { SystemGeneralService, WebSocketService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';

@UntilDestroy()
@Component({
  templateUrl: 'kernel-form.component.html',
  styleUrls: ['./kernel-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KernelFormComponent {
  isFormLoading = false;
  form = this.fb.group({
    autotune: [false],
    debugkernel: [false],
  });

  readonly tooltips = {
    autotune: helptextSystemAdvanced.autotune_tooltip,
    debugkernel: helptextSystemAdvanced.debugkernel_tooltip,
  };

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private sysGeneralService: SystemGeneralService,
    private modalService: IxModalService,
    private cdr: ChangeDetectorRef,
  ) {}

  setupForm(group: AdvancedConfig): void {
    this.form.patchValue({
      autotune: group?.autotune,
      debugkernel: group?.debugkernel,
    });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    const values = this.form.value;
    const commonBody = {
      autotune: values.autotune,
      debugkernel: values.debugkernel,
    };
    this.isFormLoading = true;
    this.ws.call('system.advanced.update', [commonBody]).pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.modalService.close();
      this.sysGeneralService.refreshSysGeneral();
    }, (res) => {
      this.isFormLoading = false;
      new EntityUtils().handleWSError(this, res);
      this.cdr.markForCheck();
    });
  }
}
