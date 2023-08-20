import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LobbiesComponent} from "./components/lobbies/lobbies.component";
import {WelcomeComponent} from "./components/welcome/welcome.component";
import {AuthGuard} from "./auth.guard";
import {LobbyComponent} from "./components/lobby/lobby.component";
import {GameComponent} from "./components/games/game/game.component";

const routes: Routes = [
  {path: "lobbies", component: LobbiesComponent, canActivate: [AuthGuard]},
  {path: "lobby/:id", component: LobbyComponent, canActivate: [AuthGuard]},
  {path: "game/:id", component: GameComponent, canActivate: [AuthGuard]},
  {path: "welcome", component: WelcomeComponent},
  {path: "", component: WelcomeComponent},
  {path: "**", redirectTo: "welcome", pathMatch: "full"}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
