import { AccessControl, Permission } from "role-acl";
import { PermissionsFailure, userDoesNotHavePermissionsFailure } from "./permissions.failure";
import { CommunicationClientType } from "../communication-types";
import { Failure } from "../utils/Failure";
import { Either, success, failure } from "../utils/Either";
import { User } from "../domain/user/user.entity";
import { Log } from "../utils/Log";

export class Permissions {
  private _ac: AccessControl;

  constructor() {
    this._ac = new AccessControl();
    this.load();
  }

  private load(): void {
    let grantsObject = [
      // condition: {
      //   Fn: "EQUALS",
      //   args: { requesterUserId: "$.gameCreatorUserId" }
      // }
      { resource: "*", role: "admin", action: "*" },

      { resource: "game", role: ["game-creator", "referee"], action: ["create", "update", "end"] },
      { resource: "game", role: ["user"], action: ["create", "!update", "!end"] },

      { resource: "lobby", role: ["game-creator", "referee"], action: ["add", "remove"] },
      { resource: "lobby", role: ["user"], action: ["!add", "!remove"] }
    ];

    this._ac.setGrants(grantsObject);
  }

  get ac(): AccessControl {
    return this._ac;
  }

  /**
   * Returns either a failure message formatted to the context of the requesting source (e.g. web or Discord request), or true if permitted.
   *
   * By "context" we mean, for example, including the Discord username like <@username> or a web username like "username".
   *
   * @param {Permission} permission
   * @param {CommunicationClientType} requestingSource
   * @returns {Either<Failure<PermissionsFailure>, boolean>}
   */
  buildPermittedResult({
    permission,
    requestingSource,
    action,
    user,
    entityId
  }: {
    permission: Permission;
    requestingSource: CommunicationClientType;
    action: string;
    user: User;
    entityId: number;
  }): Either<Failure<PermissionsFailure>, boolean> {
    if (permission.granted === true) {
      return success(true);
    }

    if (permission.roles.length > 1) {
      Log.warn("Multiple roles being permission-checked. This is probably unexpected. The roles are: ", permission.roles);
    }

    // build a contextual message about why permission was denied
    if (requestingSource === "discord") {
      // TODO: Extract this out to its own class/method, implementing some interface that both Discord and Web failures can use
      const userRole = permission.roles;
      // const requiredMinRole = ""; permission.granted
      const attemptedAction = action;
      const targetResource = permission.resource;
      // TODO: 'a' vs 'an'
      // TODO: Some way to get the minimum role for the requested action on the target resource so we can let the user know what they need to be.
      // TODO: Some context-specific instruction on how the user can obtain a higher role (e.g. ask game-creator bob to use command !obr somecommandon <user>)
      const reason =
        `Oops! Can't do that. <@${user.discordUser.discordUserId}> has a role of '${userRole}' and this role is not permitted ` +
        `to perform a ${targetResource} ${attemptedAction} on ${targetResource} ID ${entityId}. You may want to ask someone to grant you another role if you need to do this.`;
      const permissionsFailure = userDoesNotHavePermissionsFailure(reason);
      return failure(permissionsFailure);
    } else if (requestingSource === "web") {
      throw new Error("Web user permissions failure handler not implemented.");
    } else {
      const _exhaustiveCheck: never = requestingSource;
      return _exhaustiveCheck;
    }
  }
}
