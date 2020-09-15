import { Component, Input } from '@angular/core';
import { WebSocketService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';

@Component({
  selector: 'app-sys-info',
  templateUrl: './sys-info.component.html',
})
export class SysInfoComponent {
  @Input() version;
  @Input() model;
  @Input() product;
  @Input() memory;
  @Input() serial;
  @Input() FN_instructions;
  @Input() hasLicense;

  // Additional fields for licensed customers
  @Input() customer_name;
  @Input() features;
  @Input() contract_type;
  @Input() expiration_date;
  @Input() add_hardware;
  @Input() daysLeftinContract;

  constructor(protected loader: AppLoaderService, protected dialogService: DialogService,
    protected ws: WebSocketService) { }

}
