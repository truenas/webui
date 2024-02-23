import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@Component({
  selector: 'ix-empty',
  templateUrl: './empty.component.html',
  styleUrls: ['./empty.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    MatButtonModule,
    TranslateModule,
    MatProgressSpinnerModule,
    IxIconModule,
    TestIdModule,
  ],
})
export class EmptyComponent {
  @Input() conf: EmptyConfig;

  doAction(): void {
    if (this.conf.button.action) {
      this.conf.button.action();
    }
  }

  get isLoading(): boolean {
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
