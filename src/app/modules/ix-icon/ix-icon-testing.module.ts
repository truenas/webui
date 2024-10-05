import { NgModule } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { FakeMatIconRegistry, MatIconTestingModule } from '@angular/material/icon/testing';
import { IxIconRegistry } from 'app/modules/ix-icon/ix-icon-registry.service';

@NgModule({
  imports: [MatIconTestingModule],
  providers: [
    { provide: IxIconRegistry, useClass: FakeMatIconRegistry },
    { provide: MatIconRegistry, useClass: FakeMatIconRegistry },
  ],
})
export class IxIconTestingModule {}
