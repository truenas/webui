import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Subscriber } from 'rxjs';
import { TerminalConfiguration, TerminalConnectionData } from 'app/interfaces/terminal.interface';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';

@UntilDestroy()
@Component({
  selector: 'ix-instance-container',
  template: '<ix-terminal [conf]="this"></ix-terminal>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TerminalComponent],
})
export class InstanceConsoleComponent implements TerminalConfiguration {
  protected instanceId = signal('');

  get connectionData(): TerminalConnectionData {
    return {
      virt_instance_id: this.instanceId(),
      use_console: true,
    };
  }

  constructor(
    private aroute: ActivatedRoute,
  ) {}

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
        this.instanceId.set(params['id'] as string);
        subscriber.next();
      });
    });
  }
}
