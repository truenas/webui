import { Component } from '@angular/core';
import { EntityTableAction } from 'app/pages/common/entity/entity-table/entity-table.component';
import { ModalService } from '../../../services/modal.service';
import helptext from '../../../helptext/directoryservice/kerberoskeytabs-form-list';
import { T } from '../../../translate-marker';
import { Subscription } from 'rxjs';
import { KerberosKeytabsFormComponent } from './kerberoskeytabs-form.component';
@UntilDestroy()
@Component({
  selector: 'app-kerberos-keytabs-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class KerberosKeytabsListComponent {
  title = 'Kerberos Keytabs';
  protected queryCall = 'kerberos.keytab.query';
  protected wsDelete = 'kerberos.keytab.delete';
  protected entityList: any;
  private refreshTableSubscription: Subscription;

  columns: any[] = [
    { name: 'Name', prop: 'name', always_display: true },
  ];
  rowIdentifier = 'name';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: helptext.kkt_list_delmsg_title,
      key_props: helptext.kkt_list_delmsgkey_props,
    },
  };

  constructor(private modalService: ModalService) { }

  afterInit(entityList: any): void {
    this.entityList = entityList;
    this.refreshTableSubscription = this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshTableSubscription) {
      this.refreshTableSubscription.unsubscribe();
    }
  }

  getAddActions(): EntityTableAction[] {
    return [{
      label: T('Add'),
      onClick: () => {
        this.doAdd();
      },
    }] as EntityTableAction[];
  }

  getActions(row: any): EntityTableAction[] {
    const actions = [];
    actions.push({
      id: 'edit',
      label: T('Edit'),
      disabled: row.disableEdit,
      onClick: (row: any) => {
        this.doAdd(row.id);
      },
    }, {
      id: 'delete',
      label: T('Delete'),
      onClick: (row: any) => {
        this.entityList.doDelete(row);
      },
    });

    return actions as EntityTableAction[];
  }

  doAdd(id?: number): void {
    const formComponent = new KerberosKeytabsFormComponent(this.modalService);
    this.modalService.open('slide-in-form', formComponent, id);
  }
}
