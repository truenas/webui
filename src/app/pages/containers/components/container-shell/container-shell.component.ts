import { ChangeDetectionStrategy, Component, DestroyRef, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscriber } from 'rxjs';
import { TerminalConfiguration, TerminalConnectionData } from 'app/interfaces/terminal.interface';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';

@Component({
  selector: 'ix-container-shell',
  template: '<ix-terminal [conf]="this"></ix-terminal>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TerminalComponent],
})
export class ContainerShellComponent implements TerminalConfiguration {
  private aroute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  protected instanceId = signal(0);

  get connectionData(): TerminalConnectionData {
    return {
      container_id: this.instanceId(),
      use_console: false,
    };
  }

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      this.aroute.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        this.instanceId.set(parseInt(params['id'] as string, 10));
        subscriber.next();
      });
    });
  }
}
