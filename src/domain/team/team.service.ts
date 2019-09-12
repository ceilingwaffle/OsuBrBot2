import { Either, failurePromise } from "../../utils/Either";
import { Failure } from "../../utils/Failure";
import { OsuUserFailure, banchoOsuUserIdIsInvalidFailure } from "../user/user.failure";
import { GameFailure } from "../game/game.failure";
import { TeamFailure } from "./team.failure";
import { Team } from "./team.entity";
import { PermissionsFailure } from "../../permissions/permissions.failure";
import { injectable, inject } from "inversify";
import TYPES from "../../types";
import { UserService } from "../user/user.service";
import { GameService } from "../game/game.service";
import { Permissions } from "../../permissions/permissions";
import { Log } from "../../utils/Log";
import { ColorPicker } from "../../utils/color-picker";
import { User } from "../user/user.entity";
import { RequestDto } from "../../requests/dto/request.dto";
import { Helpers } from "../../utils/helpers";
import { OsuUserValidationResult } from "../../osu/types/osu-user-validation-result";
import { ApiOsuUser } from "../../osu/types/api-osu-user";
import { OsuUser } from "../user/osu-user.entity";

@injectable()
export class TeamService {
  constructor(
    @inject(TYPES.UserService) protected userService: UserService,
    @inject(TYPES.GameService) protected gameService: GameService,
    @inject(TYPES.Permissions) protected permissions: Permissions
  ) {
    Log.debug(`Initialized ${this.constructor.name}`);
  }

  /**
   * Attempts to add a new team to a game after creating all osu user entities that make up the teams.
   *
   * @param {{
   *     osuUsernamesOrIdsOrSeparators: string[];
   *     userId: number;
   *   }} {
   *     osuUsernamesOrIdsOrSeparators,
   *     userId
   *   }
   * @returns {(Promise<Either<Failure<TeamFailure | OsuUserFailure | GameFailure>, Lobby>>)}
   */
  async processAddingNewTeams({
    osuUsernamesOrIdsOrSeparators,
    requestingUser,
    requestDto
  }: {
    osuUsernamesOrIdsOrSeparators: string[];
    requestingUser: User;
    requestDto: RequestDto;
  }): Promise<Either<Failure<TeamFailure | OsuUserFailure | GameFailure | PermissionsFailure>, Team[]>> {
    try {
      // find the user's most recent game created, or !targetgame
      const targetGameResult = await this.gameService.getRequestingUserTargetGame({ userId: requestingUser.id });
      if (targetGameResult.failed()) {
        Log.methodFailure(this.processAddingNewTeams, this.constructor.name);
        return failurePromise(targetGameResult.value);
      }
      const game = targetGameResult.value;

      // ensure the requesting-user has permission to add a team to the target game
      const userRole = await this.gameService.getUserRoleForGame(requestingUser.id, game.id);
      const userPermittedResult = await this.permissions.checkUserPermission({
        user: requestingUser,
        userRole: userRole,
        action: "addteam",
        resource: "game",
        entityId: game.id,
        requesterClientType: requestDto.commType
      });
      if (userPermittedResult.failed()) {
        Log.methodFailure(
          this.processAddingNewTeams,
          this.constructor.name,
          `User ${requestingUser.id} does not have permission to add a team to game ${game.id}.`
        );
        return failurePromise(userPermittedResult.value);
      }

      // validate the osu usernames with bancho
      const apiOsuUsers: (ApiOsuUser | String)[] = [];
      for (const item of osuUsernamesOrIdsOrSeparators) {
        if (Helpers.isAddTeamCommandSeparator(item)) {
          apiOsuUsers.push(item);
          continue;
        }
        const valid: OsuUserValidationResult = await this.userService.isValidBanchoOsuUserIdOrUsername(item);
        if (!valid) return failurePromise(banchoOsuUserIdIsInvalidFailure(item));
        apiOsuUsers.push(valid.osuUser);
      }

      // validate the osu users are not already in a team for this game
      const teamsOfApiOsuUsers = this.extractApiOsuUserTeamsBetweenSeparators(apiOsuUsers);

      // ! validate the team structure (e.g. does the game require teams to be of a certain size)
      // get/create the osu users
      const osuUsers: OsuUser[] = await this.userService.getOrCreateAndSaveOsuUsersFromApiResults(teamsOfApiOsuUsers);

      // create the team
      // assign a color to the team using ColorPicker
      // add the teams to the game
      throw new Error("TODO: Implement method of TeamService.");
    } catch (error) {
      Log.methodError(this.processAddingNewTeams, this.constructor.name, error);
      throw error;
    }
  }

  /**
   * e.g. [a,b,|,c,d,|,e,f] --> [[a,b],[c,d],[e,f]]
   *
   * @private
   * @param {(ApiOsuUser | String)[]} from
   * @returns {ApiOsuUser[][]}
   */
  private extractApiOsuUserTeamsBetweenSeparators(from: (ApiOsuUser | String)[]): ApiOsuUser[][] {
    // TODO: unit test
    const separators: string[] = ["|"];
    const groups: ApiOsuUser[][] = [];
    var i = from.length;
    const copy = from.slice();
    copy.push(separators[0]); // somewhat hacky solution to just add a separator to the beginning to make this work
    const items = copy.reverse();
    while (i--) {
      const item = items[i];
      if ((typeof item === "string" && separators.includes(item)) || i === 0) {
        const team = items.splice(i + 1, items.length - 1 - i).reverse() as ApiOsuUser[];
        groups.push(team);
        items.splice(i, 1);
      }
    }
    return groups;
  }
}
