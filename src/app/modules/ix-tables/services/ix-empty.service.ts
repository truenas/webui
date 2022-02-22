import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';

@Injectable()
export class IxEmptyService {
  private readonly loadingConfig: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };

  private readonly emptyConfig: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('No items have been added yet'),
  };

  private readonly errorConfig: EmptyConfig = {
    type: EmptyType.Errors,
    large: true,
    title: this.translate.instant('Can not retrieve response'),
  };

  constructor(private translate: TranslateService) { }

  defaultEmptyConfig(type: EmptyType): EmptyConfig {
    switch (type) {
      case EmptyType.Loading:
        return this.loadingConfig;
      case EmptyType.Errors:
        return this.errorConfig;
      default:
        return this.emptyConfig;
    }
  }
}
