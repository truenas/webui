import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { CoreService } from 'app/core/services/core.service';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreEvent } from 'app/interfaces/events';

export interface PageOptions {
  data: any[];
  events: Subject<CoreEvent>;
  url: string;
}

// This makes the metadata available globally
// Deal-Breaker: Angular injects the component's
// directory path forcing relative paths
export const PageComponentMetadata = {
  selector: 'page',
  template: '',
};

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
