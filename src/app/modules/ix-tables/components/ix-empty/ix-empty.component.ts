import { Component, Input } from '@angular/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

@Component({
  selector: 'ix-empty',
  templateUrl: './ix-empty.component.html',
  styleUrls: ['./ix-empty.component.scss'],
})

export class IxEmptyComponent {
  @Input() conf: EmptyConfig = {
    title: 'rehan',
    message: 'rehan',
    large: false,
    type: EmptyType.NoPageData,
  };

  doAction(): void {
    if (this.conf.button.action) {
      this.conf.button.action();
    }
  }

  // ngOnInit() {
  //   console.log("inside ix empty component");
  // }

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
