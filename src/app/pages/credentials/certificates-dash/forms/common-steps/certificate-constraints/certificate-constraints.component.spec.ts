import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateConstraintsComponent } from './certificate-constraints.component';

describe('CertificateConstraintsComponent', () => {
  let component: CertificateConstraintsComponent;
  let fixture: ComponentFixture<CertificateConstraintsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CertificateConstraintsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificateConstraintsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
