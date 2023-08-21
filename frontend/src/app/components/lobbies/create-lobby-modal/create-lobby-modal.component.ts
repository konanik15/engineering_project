import {Component, OnInit} from '@angular/core';
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {LobbiesService} from "../../utils/lobbies-service";
import {GameLiteDTO, LobbyDTO} from '../../utils/dto';
import {GamesService} from "../../utils/games-service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-create-lobby-modal',
  templateUrl: './create-lobby-modal.component.html',
  styleUrls: ['./create-lobby-modal.component.css']
})
export class CreateLobbyModalComponent implements OnInit {

  lobbyForm = {} as FormGroup;

  games: GameLiteDTO[] = [];

  constructor(public modalRef: MdbModalRef<CreateLobbyModalComponent>,
              private formBuilder: FormBuilder,
              private lobbiesService: LobbiesService,
              private gamesService: GamesService,
              private router: Router) {
  }

  ngOnInit(): void {
    this.gamesService.getGames().subscribe({
      next: (value) => {
        this.games = value
      },
      error: () => {
        console.log('Smth went wrong with getting available games')
      }
    });
    this.createLobbyForm();
    if (this.lobbyForm != null) {
      this.lobbyForm.get('passwordProtected')?.valueChanges.subscribe(x => {
        this.revertPasswordInputStatus()
      })
    }
  }

  createLobbyForm() {
    this.lobbyForm = this.formBuilder.group({
      lobbyName: ['', Validators.required],
      game: ['', Validators.required],
      passwordProtected: [false],
      password: [{value: '', disabled: true}],
    });

  }

  get lobbyName(): string {
    return this.lobbyForm.get('lobbyName')?.value
  }

  get game(): string {
    return this.lobbyForm.get('game')?.value
  }

  get passwordProtected(): boolean {
    if (this.lobbyForm) {
      return <boolean>this.lobbyForm.get('passwordProtected')?.value
    } else return false
  }

  get password(): string {
    return this.lobbyForm.get('password')?.value
  }

  get fromValues(): LobbyDTO {
    return {
      name: this.lobbyName,
      game: this.game,
      password: this.password
    }
  }

  submit() {
    console.log('submitting lobby creation')
    this.lobbiesService.createLobby(this.fromValues).subscribe({
      complete: () => {
        this.modalRef.close()
      },
      next: (lobby) => {
        //Can't move it into nice service due to popup blocker
        const url = this.router.serializeUrl(
          this.router.createUrlTree([`/lobby/${lobby.lobbyId}`])
        );

        window.open(url, '_blank')?.focus();
      },
      error: () => {
        console.log('Smth went wrong with creating lobbies')
      }
    })
  }


  private revertPasswordInputStatus() {
    if (this.lobbyForm.get('passwordProtected')?.value) {
      this.lobbyForm.controls['password'].enable()
      this.lobbyForm.controls['password'].setValidators([Validators.required]);
    } else this.lobbyForm.controls['password'].disable()
    this.lobbyForm.get('password')?.setValue('')
    this.lobbyForm.controls['password'].clearValidators();
  }

}
