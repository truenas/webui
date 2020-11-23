import { Component, OnInit } from '@angular/core';

import { WebSocketService } from '../../services/index';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {
  public catalogApps = [];

  constructor(private ws: WebSocketService) { }

  ngOnInit(): void {
    this.ws.call('catalog.query', [[], {"extra": {"item_details": true}}]).subscribe(res => {
      console.log('cat query with extra', res)
      for (let i in res[0].trains.test) {  // charts, not test, is where the stable stuff will be
        let item = res[0].trains.test[i];
        let versions = item.versions;
        let latest, latestDetails;

        for (let j in versions) {
          latest = (Object.keys(versions)[0]);
          latestDetails = versions[Object.keys(versions)[0]];
        }

        let catalogItem = {
          name: item.name,
          icon_url: item.icon_url? item.icon_url : '/assets/images/ix-original.png',
          latest_version: latest,
          info: latestDetails.app_readme
        }
        this.catalogApps.push(catalogItem);
        console.log(this.catalogApps)
      }
    })
  }
}
