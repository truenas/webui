import { Component, Input } from '@angular/core';
import { WebSocketService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { helptext_system_support as helptext } from 'app/helptext/system/support';

@Component({
  selector: 'app-fn-sys-info',
  templateUrl: './fn-sys-info.component.html'
})
export class FnSysInfoComponent {
  @Input() FN_version;
  @Input() FN_model;
  @Input() FN_memory;
  @Input() FN_serial;
  @Input() FN_instructions;

  constructor(protected loader: AppLoaderService, protected dialogService: DialogService,
    protected ws: WebSocketService) { }

  updateLicense() {
    const self = this;
    const licenseForm: DialogFormConfiguration = {
      title: helptext.core_upgrade_license.dialog_title,
      fieldConfig: [
        {
          type: 'paragraph',
          name: 'tn_core_upgrade_license_message',
          paraText: helptext.core_upgrade_license.dialog_msg
        },
        {
          type: 'textarea',
          name: 'license',
          placeholder: helptext.update_license.license_placeholder
        }
      ],
      saveButtonText: helptext.update_license.save_button,
      customSubmit: function (entityDialog) {
        const value = entityDialog.formValue.license;
        self.loader.open();
        self.ws.call('system.license_update', [value]).subscribe((res) => {
          entityDialog.dialogRef.close(true);
          self.loader.close();
          self.dialogService.confirm(helptext.update_license.reload_dialog_title, 
            helptext.update_license.reload_dialog_message, true, helptext.update_license.reload_dialog_action)
            .subscribe((res) => {
              if (res) {
                document.location.reload(true);
              }
          });
        },
        (err) => {
          self.loader.close();
          self.dialogService.errorReport((helptext.update_license.error_dialog_title), err.reason, err.trace.formatted);
        });
      }

    }
    this.dialogService.dialogForm(licenseForm);
  }
 
}
