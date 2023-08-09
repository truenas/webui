import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { VmDisplayWebUriParams, VmDisplayWebUriParamsOptions } from 'app/interfaces/virtual-machine.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DisplayVmDialogData } from 'app/pages/vm/vm-list/display-vm-dialog/display-vm-dialog-data.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './display-vm-dialog.component.html',
  styleUrls: ['./display-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayVmDialogComponent {
  form = this.formBuilder.group({
    display_device: [null as number, Validators.required],
    password: ['', Validators.required],
  });

  optionsDevice$ = of(
    this.data.displayDevices.map((device) => ({
      label: device.attributes.type,
      value: device.id,
    })),
  );

  get isSingleDevice(): boolean {
    return this.data.displayDevices.length === 1;
  }

  get isPasswordConfigured(): boolean {
    return this.form.controls.password.enabled;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DisplayVmDialogData,
    @Inject(WINDOW) private window: Window,
    private dialogRef: MatDialogRef<DisplayVmDialogComponent>,
    private formBuilder: FormBuilder,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: AppLoaderService,
  ) {
    if (this.isSingleDevice && !this.data.displayDevices[0].attributes.password_configured) {
      this.dialogRef.close(true);
      this.openDisplayDevice(this.data.displayDevices[0].id);
      return;
    }

    this.form.controls.display_device.valueChanges.pipe(untilDestroyed(this)).subscribe((selectDeviceId: number) => {
      this.form.controls.password.patchValue('');
      if (this.data.displayDevices.find((device) => device.id === selectDeviceId).attributes.password_configured) {
        this.form.controls.password.enable();
      } else {
        this.form.controls.password.disable();
      }
    });

    if (this.data.displayDevices.length) {
      this.form.controls.display_device.patchValue(this.data.displayDevices[0].id);
    } else {
      this.form.controls.password.disable();
    }
  }

  onOpen(): void {
    this.openDisplayDevice(this.form.value.display_device, this.form.value.password);
  }

  private openDisplayDevice(displayDeviceId: number, password?: string): void {
    let displayOptions = {
      protocol: this.window.location.protocol.replace(':', '').toUpperCase(),
    } as VmDisplayWebUriParamsOptions;

    if (password) {
      displayOptions = {
        ...displayOptions,
        devices_passwords: [
          { device_id: displayDeviceId, password },
        ],
      };
    }

    const requestParams: VmDisplayWebUriParams = [
      this.data.vm.id,
      this.window.location.host,
      displayOptions,
    ];

    this.ws.call('vm.get_display_web_uri', requestParams)
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this)
      )
      .subscribe((webUris) => {
        const webUri = webUris[displayDeviceId];
        if (webUri.error) {
          this.dialogService.warn(this.translate.instant('Error'), webUri.error);
          return;
        }
        this.window.open(webUri.uri, '_blank');
        this.dialogRef.close(true);
      });
  }
}
