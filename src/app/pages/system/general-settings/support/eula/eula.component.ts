import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WebSocketService2 } from 'app/services/ws2.service';

@UntilDestroy()
@Component({
  selector: 'ix-eula',
  templateUrl: './eula.component.html',
  styleUrls: ['./eula.component.scss'],
})
export class EulaComponent implements OnInit {
  eula: string;

  constructor(private ws: WebSocketService2, private router: Router) { }

  ngOnInit(): void {
    this.ws.call('truenas.get_eula').pipe(untilDestroyed(this)).subscribe((eula) => {
      this.eula = eula;
    });
  }

  goToSupport(): void {
    this.router.navigate(['/system/support']);
  }
}
