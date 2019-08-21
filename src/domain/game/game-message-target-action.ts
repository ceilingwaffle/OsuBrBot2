import { CommunicationClientType } from "../../requests/dto/request.dto";

/**
 * Used to modify the Message Targets of a Game in some way.
 * Specifies how the game is modified, and what it's modified with.
 *
 * @export
 * @interface GameMessageTargetAction
 */
export interface GameMessageTargetAction {
  /**
   * overwrite-all: Overwrites all other game message-target-channels with this channel.
   *
   * add: Pushes this channel onto the array of game message-target-channels.
   *
   * remove: Removes this channel from the array of game message-target-channels.
   *
   * @type {("overwrite-all" | "add" | "remove")}
   */
  action: "overwrite-all" | "add" | "remove";

  /**
   * e.g. Discord or web
   *
   * @type {CommunicationClientType}
   * @memberof GameMessageTargetAction
   */
  type: CommunicationClientType;
  /**
   * The target channel ID (e.g. Discord channel ID).
   *
   * @type {string}
   */
  channelId: string;
}
