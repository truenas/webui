import { Component, Input, OnInit } from '@angular/core';
import { WebSocketService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { SnackbarService } from 'app/services/snackbar.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { helptext_system_support as helptext } from 'app/helptext/system/support';

@Component({
  selector: 'app-tn-sys-info',
  templateUrl: './tn-sys-info.component.html'
})
export class TnSysInfoComponent implements OnInit {
  is_freenas: boolean;
  @Input() customer_name;
  @Input() features;
  @Input() contract_type;
  @Input() expiration_date;
  @Input() model;
  @Input() sys_serial;
  @Input() add_hardware;
  @Input() daysLeftinContract;

  constructor(protected ws: WebSocketService, protected dialogService: DialogService,
    protected snackbar: SnackbarService, protected loader: AppLoaderService) { }

  ngOnInit() {
    window.localStorage['is_freenas'] === 'true' ? this.is_freenas = true : this.is_freenas = false;
  }

  updateLicense() {
    const localLoader = this.loader;
    const localWS = this.ws;
    const localSnackbar = this.snackbar;
    const localDialogService = this.dialogService;

    const licenseForm: DialogFormConfiguration = {
      title: helptext.update_license.dialog_title,
      fieldConfig: [
        {
          type: 'textarea',
          name: 'license',
          placeholder: helptext.update_license.license_placeholder
        }
      ],
      saveButtonText: helptext.update_license.save_button,
      customSubmit: function (entityDialog) {
        const value = entityDialog.formValue.license;
        localLoader.open();
        localWS.call('system.license_update', [value]).subscribe((res) => {
          entityDialog.dialogRef.close(true);
          localLoader.close();
          localDialogService.confirm(helptext.update_license.reload_dialog_title, 
            helptext.update_license.reload_dialog_message, true, helptext.update_license.reload_dialog_action)
            .subscribe((res) => {
              if (res) {
                document.location.reload(true);
              }
          });
        },
        (err) => {
          localLoader.close();
          entityDialog.dialogRef.close(true);
          localDialogService.errorReport((helptext.update_license.error_dialog_title), err.reason, err.trace.formatted);
        });
      }

    }
    this.dialogService.dialogForm(licenseForm);
  }
}
