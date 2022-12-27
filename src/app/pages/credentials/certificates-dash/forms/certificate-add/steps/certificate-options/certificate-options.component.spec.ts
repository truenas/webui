import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateOptionsComponent } from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-options/certificate-options.component';

describe('CertificateOptionsComponent', () => {
  let component: CertificateOptionsComponent;
  let fixture: ComponentFixture<CertificateOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CertificateOptionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificateOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
