import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  combineLatest, Observable, Subject, Subscriber,
} from 'rxjs';
import { TerminalConfiguration, TerminalConnectionData } from 'app/interfaces/terminal.interface';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';

@UntilDestroy()
@Component({
  selector: 'ix-container-shell',
  template: '<ix-terminal [conf]="this"></ix-terminal>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TerminalComponent,
  ],
})
export class ContainerShellComponent implements TerminalConfiguration {
  reconnectShell$ = new Subject<void>();

  protected appName: string;
  protected containerId: string;

  get connectionData(): TerminalConnectionData {
    return {
      app_name: this.appName,
      container_id: this.containerId,
      command: '/bin/sh',
    };
  }

  constructor(
    private aroute: ActivatedRoute,
  ) {}

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      combineLatest([this.aroute.params, this.aroute.parent.params]).pipe(
        untilDestroyed(this),
      ).subscribe(([params, parentParams]: [Record<string, unknown>, Record<string, unknown>]) => {
        this.appName = parentParams.appId as string;
        this.containerId = params.containerId as string;
        subscriber.next();
      });
    });
  }
}
