import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Subscriber } from 'rxjs';
import { TerminalConfiguration, TerminalConnectionData } from 'app/interfaces/terminal.interface';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';

@UntilDestroy()
@Component({
  selector: 'ix-vm-serial-shell',
  template: '<ix-terminal [conf]="this"></ix-terminal>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TerminalComponent],
})
export class VmSerialShellComponent implements TerminalConfiguration {
  protected pk: string;

  get connectionData(): TerminalConnectionData {
    return {
      vm_id: Number(this.pk),
    };
  }

  constructor(
    private aroute: ActivatedRoute,
  ) {}

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
        this.pk = params['pk'] as string;
        subscriber.next();
      });
    });
  }
}
