import {Component} from '@angular/core';
import {UnoService} from "../uno-service";

@Component({
  selector: 'app-uno-choose-color-modal',
  templateUrl: './uno-choose-color-modal.component.html',
  styleUrls: ['./uno-choose-color-modal.component.css']
})
export class UnoChooseColorModalComponent {

  gameId: string = '';

  constructor(private unoService: UnoService) {
  }

  chooseColor(color: string) {
    this.unoService.sendMessage({"type": "orderColor", "color": color}, this.gameId).subscribe({})
  }
}
