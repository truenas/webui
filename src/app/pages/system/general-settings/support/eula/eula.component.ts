import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ProductType } from 'app/enums/product-type.enum';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-eula',
  templateUrl: './eula.component.html',
  styleUrls: ['./eula.component.scss'],
})
export class EulaComponent implements OnInit {
  eula: string;

  constructor(private ws: WebSocketService, private router: Router) { }

  ngOnInit(): void {
    const productType = window.localStorage.getItem('product_type') as ProductType;
    if (productType === ProductType.Core) {
      this.router.navigate(['']);
    } else {
      this.ws.call('truenas.get_eula').pipe(untilDestroyed(this)).subscribe((eula) => {
        this.eula = eula;
      });
    }
  }

  goToSupport(): void {
    this.router.navigate(['/system/support']);
  }
}
