import {Component, Input, Output} from '@angular/core';
import {GameDTO} from "../../utils/dto";
import {LobbiesService} from "../../utils/lobbies-service";

@Component({
  selector: 'app-game-menu',
  templateUrl: './game-menu.component.html',
  styleUrls: ['./game-menu.component.css']
})
export class GameMenuComponent {
  @Input() gameSocket: any;
  @Input() @Output() game?: GameDTO;

  constructor(private lobbiesService: LobbiesService) {

  }


  protected readonly LobbiesService = LobbiesService;
}
