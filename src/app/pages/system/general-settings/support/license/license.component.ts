import { Component } from '@angular/core';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import * as _ from 'lodash';
import { DialogService, WebSocketService } from '../../../../../services';
import { ModalService } from '../../../../../services/modal.service';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { helptext_system_support as helptext } from 'app/helptext/system/support';

@Component({
  selector: 'app-license',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: []
})
export class LicenseComponent {
  private queryCall = 'none';
  private updateCall = 'system.license_update';
  public fieldSets: FieldSet[] = [
    {
      name: 'license',
      label: false,
      config: [
        {
          type: 'textarea',
          name: 'license',
          required: true,
          placeholder: helptext.update_license.license_placeholder
        }
      ]
    }
  ];
  public title = helptext.update_license.license_placeholder;
  public entityForm: any;

  constructor(private ws: WebSocketService, private modalService: ModalService,
    private loader: AppLoaderService, private dialog: DialogService) { }

  customSubmit(form) {
    this.loader.open();
    this.ws.call(this.updateCall, [form.license]).subscribe(() => {
      this.loader.close();
      this.modalService.close('slide-in-form');
    }, err => {
      this.loader.close();
      this.dialog.errorReport('Error', err.reason)
    })
  }

}