import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService } from 'app/services/ws.service';
import { ProductType } from '../../../../../enums/product-type.enum';

@Component({
  selector: 'app-eula',
  templateUrl: './eula.component.html',
  styleUrls: ['./eula.component.css'],
})
export class EulaComponent implements OnInit {
  eula: any;

  constructor(private ws: WebSocketService, private router: Router) { }

  ngOnInit(): void {
    const product_type = window.localStorage.getItem('product_type') as ProductType;
    if (product_type === ProductType.Core) {
      this.router.navigate(['']);
    } else {
      this.ws.call('truenas.get_eula').subscribe((res) => {
        this.eula = res;
      });
    }
  }

  goToSupport(): void {
    this.router.navigate(['/system/support']);
  }
}
