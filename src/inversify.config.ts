import "reflect-metadata";
import { IOsuLobbyScanner } from "./osu/interfaces/osu-lobby-scanner";
import { OsuLobbyScannerService } from "./osu/osu-lobby-scanner-service";
import { GameService } from "./domain/game/game.service";
import { GameController } from "./domain/game/game.controller";
import { UserService } from "./domain/user/user.service";
import { LobbyController } from "./domain/lobby/lobby.controller";
import { TeamController } from "./domain/team/team.controller";
import { UserController } from "./domain/user/user.controller";
import { RequesterFactory } from "./requests/requester-factory";
import { Permissions } from "./permissions/permissions";
import { Container } from "inversify";
import { TYPES } from "./types";
import { LobbyService } from "./domain/lobby/lobby.service";
import { TeamService } from "./domain/team/team.service";

// const iocContainer = new Container();
// autoProvide(iocContainer, entities);
// iocContainer.load(buildProviderModule());
// export default iocContainer;

export class IOCKernel extends Container {
  constructor() {
    super();
    this.init();
  }

  private init() {
    this.declareDependencies();
    // this.load(buildProviderModule());
  }

  private declareDependencies() {
    // game
    this.bind<GameController>(TYPES.GameController).to(GameController).inSingletonScope(); // prettier-ignore
    this.bind<GameService>(TYPES.GameService).to(GameService).inSingletonScope(); // prettier-ignore
    // user
    this.bind<UserController>(TYPES.UserController).to(UserController).inSingletonScope(); // prettier-ignore
    this.bind<UserService>(TYPES.UserService).to(UserService).inSingletonScope(); // prettier-ignore
    // lobby
    this.bind<LobbyController>(TYPES.LobbyController).to(LobbyController).inSingletonScope(); // prettier-ignore
    this.bind<LobbyService>(TYPES.LobbyService).to(LobbyService).inSingletonScope(); // prettier-ignore
    this.bind<IOsuLobbyScanner>(TYPES.IOsuLobbyScanner).to(OsuLobbyScannerService).inSingletonScope(); // prettier-ignore
    // team
    this.bind<TeamService>(TYPES.TeamService).to(TeamService).inSingletonScope(); // prettier-ignore
    this.bind<TeamController>(TYPES.TeamController).to(TeamController).inSingletonScope(); // prettier-ignore
    // ...
    this.bind<RequesterFactory>(TYPES.RequesterFactory).to(RequesterFactory).inSingletonScope(); // prettier-ignore
    this.bind<Permissions>(TYPES.Permissions).to(Permissions).inSingletonScope(); // prettier-ignore
  }
}

const iocContainer = new IOCKernel();
export default iocContainer;
