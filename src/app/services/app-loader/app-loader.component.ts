import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'app-app-loader',
  templateUrl: './app-loader.component.html',
  styleUrls: ['./app-loader.component.scss'],
})
export class AppLoaderComponent {
  title: string;
  message: string;
  private progress = 0;
  get percent(): number {
    return this.progress;
  }
  readonly progressUpdater: Subject<number> = new Subject<number>();

  withProgress(): void {
    this.progressUpdater.pipe(untilDestroyed(this)).subscribe((progress: number) => {
      this.progress = progress;
    });
  }
}
