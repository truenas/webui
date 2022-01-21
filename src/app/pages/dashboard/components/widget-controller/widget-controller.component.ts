import {
  Component, Input, Output, EventEmitter, OnDestroy,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EmptyConfig } from 'app/modules/entity/entity-empty/entity-empty.component';
import { ToolbarConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { CoreService } from 'app/services/core-service/core.service';
import { ThemeService } from 'app/services/theme/theme.service';

export interface DashConfigItem {
  name: string; // Shown in UI fields
  identifier?: string; // Comma separated 'key,value' eg. pool might have 'name,tank'
  rendered: boolean;
  position?: number;
  id?: string;
}

@UntilDestroy()
@Component({
  selector: 'widget-controller',
  templateUrl: './widget-controller.component.html',
  styleUrls: ['./widget-controller.component.scss'],
})
export class WidgetControllerComponent extends WidgetComponent implements OnDestroy {
  @Input() dashState: DashConfigItem[] = [];
  @Input() renderedWidgets?: unknown[] = [];
  @Input() hiddenWidgets?: number[] = [];
  @Input() emptyConfig: EmptyConfig;
  @Input() actionsConfig: ToolbarConfig;

  @Output() launcher = new EventEmitter<DashConfigItem>();

  title: string = this.translate.instant('Dashboard');
  subtitle: string = this.translate.instant('Navigation');
  configurable = false;
  screenType = 'Desktop'; // Desktop || Mobile

  constructor(
    public router: Router,
    public translate: TranslateService,
    public mediaObserver: MediaObserver,
    private core: CoreService,
    public themeService: ThemeService,
  ) {
    super(translate);

    mediaObserver.media$.pipe(untilDestroyed(this)).subscribe((evt) => {
      const st = evt.mqAlias === 'xs' ? 'Mobile' : 'Desktop';
      this.screenType = st;
    });
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  nameFromIdentifier(identifier: string): string {
    const spl = identifier.split(',');
    const key = spl[0];
    const value = spl[1];

    if (key === 'name') {
      return value;
    }
    return '';
  }

  launchWidget(widget: DashConfigItem): void {
    this.launcher.emit(widget);
  }

  triggerConfigure(): void {
    this.actionsConfig.target.next({ name: 'ToolbarChanged' });
  }
}
