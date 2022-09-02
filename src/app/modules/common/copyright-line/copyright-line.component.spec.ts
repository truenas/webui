import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CopyrightLineComponent } from './copyright-line.component';

describe('CopyrightLineComponent', () => {
  let component: CopyrightLineComponent;
  let fixture: ComponentFixture<CopyrightLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CopyrightLineComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(CopyrightLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
