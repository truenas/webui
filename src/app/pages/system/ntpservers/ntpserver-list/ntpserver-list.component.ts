import {Component} from '@angular/core';
import { ModalService } from '../../../../services/modal.service';
import { NTPServerFormComponent } from '../ntpserver-form/ntpserver-form.component';

@Component({
  selector : 'app-ntpserver-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class NTPServerListComponent {

  public title = "NTP Servers";
  protected queryCall = 'system.ntpserver.query';
  protected wsDelete = 'system.ntpserver.delete';
  protected route_add: string[] = [ 'system', 'ntpservers', 'add' ];
  protected route_add_tooltip = "Add NTP Server";
  protected route_edit: string[] = [ 'system', 'ntpservers', 'edit' ];
  protected route_success: string[] = [ 'system', 'ntpservers' ];

  public columns: Array<any> = [
    {name : 'Address', prop : 'address', always_display: true, minWidth: 200},
    {name : 'Burst', prop : 'burst'},
    {name : 'IBurst', prop : 'iburst'},
    {name : 'Prefer', prop : 'prefer'},
    {name : 'Min. Poll', prop : 'minpoll'},
    {name : 'Max. Poll', prop : 'maxpoll'},
  ];
  public rowIdentifier = 'address';
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'NTP Server',
      key_props: ['address']
    },
  };

  // private addComponent = new NTPServerFormComponent();

  constructor(private modalService: ModalService) {}

  // doAdd() {
  //   this.modalService.open('slide-in-form', this.addComponent);
  // }

  // doEdit(e) {
  //   console.log(e)
  //   this.modalService.open('slide-in-form', this.addComponent, e)
  // }
}
