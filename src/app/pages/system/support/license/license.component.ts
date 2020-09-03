import { Component, OnDestroy } from '@angular/core';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DialogService, WebSocketService } from '../../../../services/';
import { ModalService } from '../../../../services/modal.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { helptext_system_support as helptext } from 'app/helptext/system/support';

@Component({
  selector: 'app-license',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: []
})
export class LicenseComponent {
  private queryCall = 'none';
  private updateCall = 'system.license_update';
  title: 'License';
  public fieldConfig: FieldConfig[] = []

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

  private entityForm: any;

  constructor(private ws: WebSocketService, private modalService: ModalService,
    private loader: AppLoaderService, private dialog: DialogService) { }

  ngOnInit(): void {
  }

  beforeSubmit(data) {
    console.log(data)
  }

  // customSubmit(license) {
  //   this.loader.open();
  //   this.ws.call('system.license_update', [license]).subscribe(() => {
  //     this.loader.close();
  //     this.modalService.close('slide-in-form');
  //   }), err => {
  //     this.loader.close();
  //     this.dialog.errorReport('Error', err)
  //     ;
  //   }
  // }

}