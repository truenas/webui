import { Component, OnInit } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { WebSocketService, DialogService } from '../../../services';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'app-networksummary',
  templateUrl: './networksummary.component.html',
  styleUrls: ['./networksummary.component.css'],
})
export class NetworkSummaryComponent implements OnInit {
  ips: any;
  ipSize: number;
  default_routes: any;
  nameservers: any;
  queryCall = 'network.general.summary';

  constructor(private ws: WebSocketService, public translate: TranslateService, protected dialogService: DialogService) {}

  ngOnInit() {
    this.ws.call(this.queryCall, []).subscribe(
      (res) => {
        this.ips = res.ips;
        this.ipSize = Object.keys(res.ips).length;
        this.default_routes = res.default_routes;
        this.nameservers = res.nameservers;
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      },
    );
  }
}
