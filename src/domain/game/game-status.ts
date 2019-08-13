import { GenericType } from "../../utils/generic-type";

export class GameStatus extends GenericType {
  static readonly SCHEDULED = new GameStatus("scheduled", "Scheduled");
  static readonly IDLE_NEWGAME = new GameStatus("idle_newgame", "Idle: Awaiting first lobby");
  static readonly INPROGRESS = new GameStatus("inprogress", "In Progress");
  static readonly COMPLETED = new GameStatus("completed", "Completed");
  static readonly MANUALLY_ENDED = new GameStatus("manually_ended", "Manually Ended");
  static readonly UNKNOWN = new GameStatus("unknown", "Unknown");

  /**
   * Returns true if the given status corresponds to a game status that can be considered
   * as "endable" (e.g. an active game can be ended, but a completed game cannot).
   *
   * @static
   * @param {string} statusKey
   * @returns {boolean}
   */
  static isEndableStatus(statusKey: string): boolean {
    switch (statusKey) {
      case GameStatus.COMPLETED.getKey():
        return false;
      default:
        return true;
    }
  }
}
