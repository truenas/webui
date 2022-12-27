import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateIdentifierAndTypeComponent } from './certificate-identifier-and-type.component';

describe('CertificateIdentifierAndTypeComponent', () => {
  let component: CertificateIdentifierAndTypeComponent;
  let fixture: ComponentFixture<CertificateIdentifierAndTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CertificateIdentifierAndTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificateIdentifierAndTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
