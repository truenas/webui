import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { DialogService, WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-license',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [],
})
export class LicenseComponent implements FormConfiguration {
  updateCall: 'system.license_update' = 'system.license_update';
  protected isOneColumnForm = true;
  fieldSets: FieldSet[] = [
    {
      name: 'license',
      label: false,
      config: [
        {
          type: 'textarea',
          name: 'license',
          required: true,
          placeholder: helptext.update_license.license_placeholder,
        },
      ],
    },
  ];
  title = helptext.update_license.license_placeholder;

  constructor(private ws: WebSocketService, private modalService: ModalService,
    private loader: AppLoaderService, private dialog: DialogService) { }

  customSubmit(form: any): void {
    this.loader.open();
    this.ws.call(this.updateCall, [form.license]).pipe(untilDestroyed(this)).subscribe(() => {
      this.loader.close();
      // To make sure EULA opens on reload; removed from local storage (in topbar) on acceptance of EULA
      window.localStorage.setItem('upgrading_status', 'upgrading');
      this.dialog.confirm({
        title: helptext.update_license.reload_dialog_title,
        message: helptext.update_license.reload_dialog_message,
        hideCheckBox: true,
        buttonMsg: helptext.update_license.reload_dialog_action,
        hideCancel: true,
        disableClose: true,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        document.location.reload(true);
      });
      this.modalService.close('slide-in-form');
    }, (err) => {
      this.loader.close();
      this.dialog.errorReport('Error', err.reason);
    });
  }
}
