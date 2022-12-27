import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateCsrExistsComponent } from './certificate-csr-exists.component';

describe('CertificateCsrExistsComponent', () => {
  let component: CertificateCsrExistsComponent;
  let fixture: ComponentFixture<CertificateCsrExistsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CertificateCsrExistsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificateCsrExistsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
