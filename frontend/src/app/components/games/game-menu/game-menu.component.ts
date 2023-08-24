import {Component, Input, OnInit} from '@angular/core';
import {GameDTO} from "../../utils/dto";
import {LobbiesService} from "../../utils/lobbies-service";

@Component({
  selector: 'app-game-menu',
  templateUrl: './game-menu.component.html',
  styleUrls: ['./game-menu.component.css']
})
export class GameMenuComponent implements OnInit {
  @Input() gameSocket: any;
  @Input() game?: GameDTO;

  constructor(private lobbiesService: LobbiesService) {

  }

  ngOnInit(): void {
    console.log(LobbiesService.lobbySocket)
  }


  protected readonly LobbiesService = LobbiesService;
}
