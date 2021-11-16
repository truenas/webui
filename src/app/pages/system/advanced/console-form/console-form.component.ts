import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { choicesToOptions } from 'app/helpers/options.helper';
import { helptextSystemAdvanced as helptext } from 'app/helptext/system/advanced';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import {
  DialogService, SystemGeneralService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './console-form.component.html',
  styleUrls: ['./console-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleFormComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    consolemenu: [true],
    serialconsole: [true],
    serialport: [''],
    serialspeed: [''],
    motd: [''],
  });

  readonly tooltips = {
    consolemenu: helptext.consolemenu_tooltip,
    serialconsole: helptext.serialconsole_tooltip,
    serialport: helptext.serialport_tooltip,
    serialspeed: helptext.serialspeed_tooltip,
    motd: helptext.motd_tooltip,
  };

  readonly serialSpeedOptions$ = of([
    { label: '9600', value: '9600' },
    { label: '19200', value: '19200' },
    { label: '38400', value: '38400' },
    { label: '57600', value: '57600' },
    { label: '115200', value: '115200' },
  ]);

  readonly serialPortOptions$ = this.ws.call('system.advanced.serial_port_choices').pipe(choicesToOptions());

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private sysGeneralService: SystemGeneralService,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('system.advanced.config')
      .pipe(untilDestroyed(this))
      .subscribe(
        (config) => {
          this.form.patchValue(config);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        (error) => {
          this.isFormLoading = false;
          new EntityUtils().handleWSError(null, error, this.dialogService);
        },
      );

    this.form.controls.serialport.enabledWhile(this.form.controls.serialconsole.value$);
    this.form.controls.serialspeed.enabledWhile(this.form.controls.serialconsole.value$);
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const values = this.form.value;

    this.ws.call('system.advanced.update', [values]).pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.sysGeneralService.refreshSysGeneral();
      this.slideInService.close();
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
    });
  }
}
