import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { WebSocketService, AppLoaderService } from '../../../../services/';
import { ModalService } from 'app/services/modal.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from '../../../common/entity/utils';
import { helptext_system_ca } from 'app/helptext/system/ca';

@Component({
  selector: 'app-ca-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class CertificateAuthorityEditComponent {

  protected queryCall: string = 'certificateauthority.query';
  protected editCall = 'certificateauthority.update';
  protected isEntity: boolean = true;
  protected queryCallOption: Array<any>;
  private getRow = new Subscription;
  private rowNum: any;
  private title: string;
  protected isOneColumnForm = true;

  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
    {
      name: helptext_system_ca.edit.fieldset_certificate,
      label: true,
      class: 'certificate',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext_system_ca.edit.name.placeholder,
          tooltip: helptext_system_ca.edit.name.tooltip,
          required: true,
          validation: helptext_system_ca.edit.name.validation
        },
        {
          type: 'textarea',
          name: 'certificate',
          placeholder: helptext_system_ca.edit.certificate.placeholder,
          readonly: true,
        },
        {
          type: 'textarea',
          name: 'privatekey',
          placeholder: helptext_system_ca.edit.privatekey.placeholder,
          readonly: true,
        },
      ]
    }
  ];

  constructor(protected ws: WebSocketService, protected loader: AppLoaderService,
    private modalService: ModalService) {
      this.getRow = this.modalService.getRow$.subscribe(rowId => {
        this.rowNum = rowId;
        this.queryCallOption = [["id", "=", rowId]];
        this.getRow.unsubscribe();
      })
  }

  afterInit() {
    this.title = helptext_system_ca.edit.title;
  }

  customSubmit(value) {
    let payload = {};
    payload['name'] = value.name;

    this.loader.open();
    this.ws.call(this.editCall, [this.rowNum, payload]).subscribe(
      (res) => {
        this.loader.close();
        this.modalService.close('slide-in-form');
        this.modalService.refreshTable();
      },
      (res) => {
        this.loader.close();
        this.modalService.refreshTable();
        new EntityUtils().handleError(this, res);
      }
    );
  }
}
