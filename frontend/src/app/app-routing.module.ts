import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LobbyComponent} from "./components/lobby/lobby.component";
import {WelcomeComponent} from "./components/welcome/welcome.component";
import {AuthGuard} from "./auth.guard";

const routes: Routes = [
    {path: "lobby", component: LobbyComponent, canActivate: [AuthGuard]},
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
