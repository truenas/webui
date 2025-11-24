import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Subscriber } from 'rxjs';
import { TerminalConfiguration, TerminalConnectionData } from 'app/interfaces/terminal.interface';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';

@UntilDestroy()
@Component({
  selector: 'ix-container-console',
  template: '<ix-terminal [conf]="this"></ix-terminal>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TerminalComponent],
})
export class ContainerConsoleComponent implements TerminalConfiguration {
  private aroute = inject(ActivatedRoute);

  protected instanceId = signal(0);

  get connectionData(): TerminalConnectionData {
    return {
      container_id: this.instanceId(),
      use_console: true,
    };
  }

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
        this.instanceId.set(parseInt(params['id'] as string, 10));
        subscriber.next();
      });
    });
  }
}
