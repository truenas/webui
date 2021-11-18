import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/services/components/service-rsync';
import { RsyncConfigUpdate } from 'app/interfaces/rsync-config.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { WebSocketService, DialogService, AppLoaderService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-rsync-configure',
  templateUrl: './rsync-configure.component.html',
  styleUrls: ['./rsync-configure.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RsyncConfigureComponent implements OnInit {
  form = this.fb.group({
    port: [873, Validators.pattern('^[0-9]*$')],
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

    this.ws.call('rsyncd.config').pipe(untilDestroyed(this)).subscribe(
      (config: RsyncConfigUpdate) => {
        this.form.patchValue(config);
        this.loader.close();
        this.cdr.markForCheck();
      },
      (error) => {
        this.loader.close();
        new EntityUtils().handleWsError(null, error, this.dialogService);
      },
    );
  }

  onSubmit(): void {
    this.loader.open();

    const values = this.form.value;
    this.ws.call('rsyncd.update', [values] as [RsyncConfigUpdate]).pipe(untilDestroyed(this)).subscribe(() => {
      this.loader.close();
      this.router.navigate(['services']);
    }, (error) => {
      this.loader.close();
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }

  cancel(): void {
    this.router.navigate(['services']);
  }
}
