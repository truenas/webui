import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { Observable } from 'rxjs';
import { AppMaintainer, AvailableApp } from 'app/interfaces/available-app.interfase';

@Component({
  selector: 'ix-app-helm-chart-card',
  templateUrl: './app-helm-chart-card.component.html',
  styleUrls: ['./app-helm-chart-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHelmChartCardComponent implements OnChanges {
  @Input() isLoading$: Observable<boolean>;
  @Input() app: AvailableApp;
  maintainerList = '';

  constructor(
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(): void {
    this.maintainerList = this.app?.maintainers.reduce(
      (list: string, maintainer: AppMaintainer, currentIndex: number) => {
        let maintainerStr = `<a href="${maintainer.url}">${maintainer.name}</a> (${maintainer.email})`;
        maintainerStr += currentIndex >= this.app.maintainers.length - 1 ? '' : ', ';
        return list + maintainerStr;
      }, '',
    ) || '';
    this.cdr.markForCheck();
  }
}
