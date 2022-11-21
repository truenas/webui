import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit, Component, Input, TemplateRef, ViewChild, ViewContainerRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

@Component({
  selector: 'ix-empty-row',
  templateUrl: './ix-empty-row.component.html',
  styleUrls: ['./ix-empty-row.component.scss'],
})
export class IxEmptyRowComponent implements AfterViewInit {
  @Input() conf: EmptyConfig = {
    title: this.translate.instant('No records'),
    message: this.translate.instant('No records to show. Create new records to show here.'),
    large: true,
    type: EmptyType.NoPageData,
  };

  @ViewChild('templatePortalContent') templatePortalContent: TemplateRef<unknown>;
  templatePortal: TemplatePortal<any>;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private translate: TranslateService,
  ) {}

  ngAfterViewInit(): void {
    this.templatePortal = new TemplatePortal(this.templatePortalContent, this.viewContainerRef);
  }

  doAction(): void {
    if (this.conf.button.action) {
      this.conf.button.action();
    }
  }

  isLoading(): boolean {
    return this.conf.type === EmptyType.Loading;
  }

  getIcon(): string {
    let icon = 'logo';
    if (this.conf.icon) {
      icon = this.conf.icon;
    } else {
      switch (this.conf.type) {
        case EmptyType.Loading:
          icon = 'logo';
          break;
        case EmptyType.FirstUse:
          icon = 'rocket';
          break;
        case EmptyType.NoPageData:
          icon = 'format-list-text';
          break;
        case EmptyType.Errors:
          icon = 'alert-octagon';
          break;
        case EmptyType.NoSearchResults:
          icon = 'magnify-scan';
          break;
      }
    }
    return icon;
  }
}
