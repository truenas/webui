import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscriber } from 'rxjs';
import { TerminalConfiguration, TerminalConnectionData } from 'app/interfaces/terminal.interface';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';

@Component({
  selector: 'ix-vm-serial-shell',
  template: '<ix-terminal [conf]="this"></ix-terminal>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TerminalComponent],
})
export class VmSerialShellComponent implements TerminalConfiguration {
  private aroute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  protected pk: string;

  get connectionData(): TerminalConnectionData {
    return {
      vm_id: Number(this.pk),
    };
  }

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      this.aroute.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        this.pk = params['pk'] as string;
        subscriber.next();
      });
    });
  }
}
