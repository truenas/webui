import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'ix-app-loader',
  templateUrl: './app-loader.component.html',
  styleUrls: ['./app-loader.component.scss'],
})
export class AppLoaderComponent {
  title: string;
  message: string;
  private progress = 0;
  actionCancelled: Subject<void> = new Subject<void>();
  cancellable = false;
  get percent(): number {
    return this.progress;
  }

  private showProgress = false;
  get shouldShowProgress(): boolean {
    return this.showProgress;
  }
  readonly progressUpdater: Subject<number> = new Subject<number>();

  withProgress(): void {
    this.showProgress = true;
    this.progressUpdater.pipe(untilDestroyed(this)).subscribe((progress: number) => {
      this.progress = progress;
    });
  }
}
