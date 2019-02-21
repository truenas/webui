import { Component, OnInit} from '@angular/core'

import { WebSocketService } from '../../../services';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../../translate-marker';

@Component({
    selector : 'app-networksummary',
    templateUrl: "./networksummary.component.html",
})
export class NetworkSummaryComponent implements OnInit{
    
    public networksummay: any;
    public ips: any;
    public default_routes: any;
    public nameservers: any;
    public queryCall = 'network.general.summary';
    constructor(private ws: WebSocketService, public translate: TranslateService){}

    ngOnInit() {
        this.ws.call(this.queryCall, []).subscribe(
            (res) => {
                this.networksummay = res;
                this.ips = res.ips;
                console.log(Object.keys(res.ips));
                
                this.default_routes = res.default_routes;
                this.nameservers = res.nameservers;
                console.log(res);
                
            },
            (err) => {

            }
        )
    }
}