import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DurakCardComponent} from './durak-card.component';

describe('DurakCardComponent', () => {
    let component: DurakCardComponent;
    let fixture: ComponentFixture<DurakCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DurakCardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DurakCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
