import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateImportComponent } from './certificate-import.component';

describe('CertificateImportComponent', () => {
  let component: CertificateImportComponent;
  let fixture: ComponentFixture<CertificateImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CertificateImportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificateImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
