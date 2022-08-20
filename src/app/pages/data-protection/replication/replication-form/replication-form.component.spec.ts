import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReplicationFormComponent } from './replication-form.component';

describe('ReplicationFormComponent', () => {
  let component: ReplicationFormComponent;
  let fixture: ComponentFixture<ReplicationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReplicationFormComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(ReplicationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
