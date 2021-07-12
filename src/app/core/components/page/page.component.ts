import { Component } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/core-service-injector';
import { CoreService } from 'app/core/services/core-service/core.service';

@Component({
  selector: 'page',
  template: '',
})
export class PageComponent {
  name = 'PageComponent';
  url: string;
  protected core: CoreService;

  constructor() {
    this.core = CoreServiceInjector.get(CoreService);
  }
}
