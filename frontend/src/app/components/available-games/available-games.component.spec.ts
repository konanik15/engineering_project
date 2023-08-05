import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AvailableGamesComponent} from './available-games.component';

describe('AvailableGamesComponent', () => {
  let component: AvailableGamesComponent;
  let fixture: ComponentFixture<AvailableGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AvailableGamesComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AvailableGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
