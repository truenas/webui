import {
  Component, Input, Output, EventEmitter,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';

export interface DashConfigItem {
  name: string; // Shown in UI fields
  identifier?: string; // Comma separated 'key,value' eg. pool might have 'name,tank'
  rendered: boolean;
  position?: number;
  id?: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-widget-controller',
  templateUrl: './widget-controller.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-controller.component.scss',
  ],
})
export class WidgetControllerComponent extends WidgetComponent {
  @Input() dashState: DashConfigItem[] = [];
  @Input() renderedWidgets?: unknown[] = [];
  @Input() hiddenWidgets?: number[] = [];
  @Input() emptyConfig: EmptyConfig;

  @Output() launcher = new EventEmitter<DashConfigItem>();

  title: string = this.translate.instant('Dashboard');
  subtitle: string = this.translate.instant('Navigation');
  configurable = false;

  constructor(
    public translate: TranslateService,
  ) {
    super(translate);
  }

  nameFromIdentifier(identifier: string): string {
    const [key, value] = identifier.split(',');

    if (key === 'name') {
      return value;
    }
    return '';
  }

  launchWidget(widget: DashConfigItem): void {
    this.launcher.emit(widget);
  }
}
