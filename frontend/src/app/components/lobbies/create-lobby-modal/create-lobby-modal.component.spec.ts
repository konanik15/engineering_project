import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CreateLobbyModalComponent} from './create-lobby-modal.component';

describe('CreateLobbyModalComponent', () => {
  let component: CreateLobbyModalComponent;
  let fixture: ComponentFixture<CreateLobbyModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateLobbyModalComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CreateLobbyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
