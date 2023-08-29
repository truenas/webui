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

// TODO: Dialog is useless now because only SPICE is supported.
// TODO: Check with middleware if vm.get_display_web_uri can be replaced with a property in vm.get_display_devices.
@UntilDestroy()
@Component({
  templateUrl: './display-vm-dialog.component.html',
  styleUrls: ['./display-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayVmDialogComponent {
  form = this.formBuilder.group({
    display_device: [null as number, Validators.required],
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
    if (this.isSingleDevice) {
      this.dialogRef.close(true);
      this.openDisplayDevice(this.data.displayDevices[0].id);
      return;
    }

    if (this.data.displayDevices.length) {
      this.form.controls.display_device.patchValue(this.data.displayDevices[0].id);
    }
  }

  onOpen(): void {
    this.openDisplayDevice(this.form.value.display_device);
  }

  private openDisplayDevice(displayDeviceId: number): void {
    this.loader.open();
    const displayOptions = {
      protocol: this.window.location.protocol.replace(':', '').toUpperCase(),
    } as VmDisplayWebUriParamsOptions;

    const requestParams: VmDisplayWebUriParams = [
      this.data.vm.id,
      this.window.location.host,
      displayOptions,
    ];

    this.ws.call('vm.get_display_web_uri', requestParams)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (webUris) => {
          this.loader.close();
          const webUri = webUris[displayDeviceId];
          if (webUri.error) {
            this.dialogService.warn(this.translate.instant('Error'), webUri.error);
            return;
          }
          this.window.open(webUri.uri, '_blank');
          this.dialogRef.close(true);
        },
        error: (error: WebsocketError) => {
          this.loader.close();
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }
}
