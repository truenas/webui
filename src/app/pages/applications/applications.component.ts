import { Component, OnInit } from '@angular/core';

import { WebSocketService } from '../../services/index';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css']
})
export class ApplicationsComponent implements OnInit {
  public catalogApps = [];

  constructor(private ws: WebSocketService) { }

  ngOnInit(): void {
    this.ws.call('catalog.items', ['OFFICIAL']).subscribe(res => {
      for (let i in res.test) {
        let item = res.test[i];
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
        console.log(catalogItem)
        this.catalogApps.push(catalogItem);
      }
    })
  }

}
