import { Component, Input, OnInit } from '@angular/core';

import { WebSocketService } from '../../../services/index';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['../applications.component.scss']
})
export class CatalogComponent implements OnInit {
  @Input() catalogApps: any[];

  constructor(private ws: WebSocketService) { }

  ngOnInit(): void {
    console.log('catalog')
  }

  doInstall(appName: string) {
    console.log(appName)
  }

  array(n: number): any[] {
    return Array(n);
  }
}
