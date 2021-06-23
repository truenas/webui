import { Component } from '@angular/core';
import { CoreService } from 'app/core/services/core.service';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';

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
