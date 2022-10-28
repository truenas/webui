import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/services/components/service-rsync';
import { RsyncConfigUpdate } from 'app/interfaces/rsync-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService, DialogService, AppLoaderService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-rsync-configure',
  templateUrl: './rsync-configure.component.html',
  styleUrls: ['./rsync-configure.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RsyncConfigureComponent implements OnInit {
  form = this.fb.group({
    port: [873, [Validators.required, Validators.min(1), Validators.max(65535)]],
    auxiliary: [''],
  });

  port = {
    fcName: 'port',
    label: helptext.rsyncd_port_placeholder,
    tooltip: helptext.rsyncd_port_tooltip,
  };

  auxiliary = {
    fcName: 'auxiliary',
    label: helptext.rsyncd_auxiliary_placeholder,
    tooltip: helptext.rsyncd_auxiliary_tooltip,
  };

  constructor(
    private fb: FormBuilder,
    protected router: Router,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    protected ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.loader.open();

    this.ws.call('rsyncd.config').pipe(untilDestroyed(this)).subscribe({
      next: (config: RsyncConfigUpdate) => {
        this.form.patchValue(config);
        this.loader.close();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    });
  }

  onSubmit(): void {
    this.loader.open();

    const values = this.form.value;
    this.ws.call('rsyncd.update', [values] as [RsyncConfigUpdate]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.router.navigate(['services']);
      },
      error: (error) => {
        this.loader.close();
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  cancel(): void {
    this.router.navigate(['services']);
  }
}
