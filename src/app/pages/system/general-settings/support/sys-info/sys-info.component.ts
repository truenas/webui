import { Component, Input } from '@angular/core';
import { WebSocketService } from 'app/services/';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';

@Component({
  selector: 'app-sys-info',
  templateUrl: './sys-info.component.html',
})
export class SysInfoComponent {
  @Input() version: string;
  @Input() model: any;
  @Input() product: any;
  @Input() memory: string;
  @Input() serial: string;
  @Input() FN_instructions: string;
  @Input() hasLicense: boolean;

  // Additional fields for licensed customers
  @Input() customer_name: string;
  @Input() features: string;
  @Input() contract_type: any;
  @Input() expiration_date: string;
  @Input() add_hardware: string;
  @Input() daysLeftinContract: number;

  constructor(protected loader: AppLoaderService, protected dialogService: DialogService,
    protected ws: WebSocketService) { }
}
