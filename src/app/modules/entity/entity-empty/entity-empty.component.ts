import { Component, Input } from '@angular/core';

export enum EmptyType {
  Loading = 'duration',
  FirstUse = 'first_use',
  NoPageData = 'no_page_data',
  Errors = 'errors',
  NoSearchResults = 'no_search_results',
}
export interface EmptyConfig {
  type?: EmptyType;
  large: boolean;
  compact?: boolean;
  title: string;
  message?: string;
  icon?: string;
  button?: {
    label: string;
    action: () => void;
  };
}
@Component({
  selector: 'ix-entity-empty',
  templateUrl: './entity-empty.component.html',
  styleUrls: ['./entity-empty.component.scss'],
})

export class EntityEmptyComponent {
  @Input() conf: EmptyConfig;

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
