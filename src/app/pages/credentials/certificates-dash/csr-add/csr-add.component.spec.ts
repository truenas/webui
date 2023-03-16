import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CsrAddComponent } from './csr-add.component';

describe('CsrAddComponent', () => {
  let component: CsrAddComponent;
  let fixture: ComponentFixture<CsrAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CsrAddComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(CsrAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
