import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import * as _ from 'lodash';
import { DialogService, WebSocketService } from '../../../../services/';
import { ModalService } from 'app/services/modal.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material/dialog';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-certificate-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class CertificateEditComponent {

  protected queryCall: string = 'certificate.query';
  protected editCall = 'certificate.update';
  protected isEntity: boolean = true;
  protected isCSR: boolean;
  protected queryCallOption: Array<any>;

  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
    {
      name: helptext_system_certificates.edit.fieldset_certificate,
      label: true,
      class: 'certificate',
      width: '100%',
      config: [
        {
        type: 'input',
        name: 'name',
        placeholder: helptext_system_certificates.edit.name.placeholder,
        tooltip: helptext_system_certificates.edit.name.tooltip,
        required: true,
        validation: helptext_system_certificates.edit.name.validation
      },
      {
        type: 'textarea',
        name: 'certificate',
        placeholder: helptext_system_certificates.edit.certificate.placeholder,
        isHidden: false,
        readonly: true,
      },
      {
        type: 'textarea',
        name: 'CSR',
        placeholder: helptext_system_certificates.edit.csr.placeholder,
        isHidden: false,
        readonly: true,
      },
      {
        type: 'textarea',
        name: 'privatekey',
        placeholder: helptext_system_certificates.edit.privatekey.placeholder,
        isHidden: false,
        readonly: true,
      }
    ]
    }
  ];

  private pk: any;
  protected certificateField: any;
  protected privatekeyField: any;
  protected CSRField: any;
  protected entityForm: any;
  protected dialogRef: any

  // public title = helptext_system_certificates.formTitle;
  protected isOneColumnForm = true;
  private rowid: any;
  private getRow = new Subscription;

  constructor(protected ws: WebSocketService, protected matDialog: MatDialog,
    protected loader: AppLoaderService, protected dialog: DialogService,
    private modalService: ModalService) {
      this.getRow = this.modalService.getRow$.subscribe(rowId => {
        this.rowid = rowId;
        this.getRow.unsubscribe();
    })
  }

  resourceTransformIncomingRestData(data) {
    if (data.CSR != null) {
      this.isCSR = true;
    }
    this.setForm();
    return data;
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
  }

  setForm() {
    this.certificateField = _.find(this.fieldConfig, { 'name': 'certificate' });
    this.privatekeyField = _.find(this.fieldConfig, { 'name': 'privatekey' });
    this.CSRField = _.find(this.fieldConfig, { 'name': 'CSR' });
    if (this.isCSR) {
      this.CSRField['isHidden'] = false;
      this.certificateField['isHidden'] = true;
      this.privatekeyField['isHidden'] = false;
    } else {
      this.CSRField['isHidden'] = true;
      this.certificateField['isHidden'] = false;
      this.privatekeyField['isHidden'] = false;
    }
  }

  customSubmit(value) {
    this.dialogRef = this.matDialog.open(EntityJobComponent, { data: { "title": "Updating Identifier" }});
    this.dialogRef.componentInstance.setCall(this.editCall, [this.rowid, {'name':value['name']}]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.matDialog.closeAll();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.matDialog.closeAll();
      this.modalService.refreshTable();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }
}
