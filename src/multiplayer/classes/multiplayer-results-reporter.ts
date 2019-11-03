import { MessageType } from "../messages/types/message-type";
import { VirtualMatchReportData } from "../virtual-match/virtual-match-report-data";
import { Game } from "../../domain/game/game.entity";
import { ReportableContextType } from "../reports/reportable-context-type";
import { ReportableContext } from "../reports/reportable-context";
import _ = require("lodash"); // do not convert to default import -- it will break!!
import { Leaderboard } from "../components/leaderboard";
import { VirtualMatchCreator } from "../virtual-match/virtual-match-creator";
import { VirtualMatchKey } from "../virtual-match/virtual-match-key";

export class MultiplayerResultsReporter {
  static getItemsToBeReported(args: {
    virtualMatchReportDatas: VirtualMatchReportData[];
    game: Game;
  }): { allReportables: ReportableContext<ReportableContextType>[]; toBeReported: ReportableContext<ReportableContextType>[] } {
    const allReportables: ReportableContext<ReportableContextType>[] = MultiplayerResultsReporter.gatherReportableItemsForGame({
      virtualMatchReportDatas: args.virtualMatchReportDatas
    });

    const reported: ReportableContext<ReportableContextType>[] = MultiplayerResultsReporter.getAlreadyReportedItemsForGame({
      virtualMatchReportDatas: args.virtualMatchReportDatas,
      game: args.game
    });

    const toBeReported: ReportableContext<ReportableContextType>[] = _.differenceWith<
      ReportableContext<ReportableContextType>,
      ReportableContext<ReportableContextType>
    >(allReportables, reported, _.isEqual);

    return { allReportables, toBeReported };
  }

  private static gatherReportableItemsForGame(args: {
    virtualMatchReportDatas: VirtualMatchReportData[];
  }): ReportableContext<ReportableContextType>[] {
    const reportables: ReportableContext<ReportableContextType>[] = [];

    args.virtualMatchReportDatas.forEach(vmrData => {
      if (vmrData.events) {
        vmrData.events.forEach(event => {
          const reportable: ReportableContext<"game_event"> = {
            type: "game_event",
            subType: event.type,
            item: event,
            beatmapId: event.data.eventMatch.beatmapId,
            sameBeatmapNumber: event.data.eventMatch.sameBeatmapNumber,
            time: event.data.timeOfEvent
          };
          reportables.push(reportable);
        });
      }
      if (vmrData.messages) {
        vmrData.messages.forEach(msgs => {
          msgs.forEach(msg => {
            const reportable: ReportableContext<"message"> = {
              type: "message",
              subType: msg.type,
              item: msg,
              beatmapId: msg.beatmapId,
              sameBeatmapNumber: msg.sameBeatmapNumber,
              time: msg.time
            };
            reportables.push(reportable);
          });
        });
      }
      if (vmrData.leaderboard) {
        const reportable: ReportableContext<"leaderboard"> = {
          type: "leaderboard",
          subType: "battle_royale",
          item: vmrData.leaderboard,
          beatmapId: vmrData.leaderboard.beatmapId,
          sameBeatmapNumber: vmrData.leaderboard.sameBeatmapNumber,
          time: vmrData.leaderboard.leaderboardEventTime
        };
        reportables.push(reportable);
      }
    });

    const filteredReportables = MultiplayerResultsReporter.getReportablesOccurringBeforeAndIncludingFinalLeaderboard(reportables);
    return filteredReportables;
  }

  /**
   * Returns reportables occurring only before (and including) the final leaderboard
   * (the first-occurring leaderboard where no more than one team remains alive).
   *
   * The idea here is that every leaderboard included in the output should always be accompanied by its related reportables
   * (e.g. game events and messages for that leaderboard).
   *
   * @private
   * @static
   * @param {ReportableContext<ReportableContextType>[]} reportables
   * @returns
   */
  private static getReportablesOccurringBeforeAndIncludingFinalLeaderboard(
    reportables: ReportableContext<ReportableContextType>[]
  ): ReportableContext<ReportableContextType>[] {
    const finalLeaderboardReportable = reportables
      .filter(r => r.type === "leaderboard" && r.subType === "battle_royale")
      .find(r => {
        const leaderboard = r.item as Leaderboard;
        // find the first occurring leaderboard having only one team alive or no remaining alive teams
        return leaderboard.leaderboardLines.filter(ll => ll.alive).length <= 1;
      });
    if (!finalLeaderboardReportable) return reportables;

    // Get all virtual match keys of leaderboards occurring before the final leaderboard (inclusive).
    // This is done instead of comparing the reportable time property, in case for some reason some
    // events for the final leaderboard have a time greater than the time of the final leaderboard.
    const targetLeaderboardVirtualMatchKeys: VirtualMatchKey[] = reportables
      .filter(r => r.type === "leaderboard" && r.subType === "battle_royale" && r.time <= finalLeaderboardReportable.time)
      .map<VirtualMatchKey>(leaderboard => ({ beatmapId: leaderboard.beatmapId, sameBeatmapNumber: leaderboard.sameBeatmapNumber }));

    const beforeAndIncludingFinalLeaderboardReportables = reportables.filter(r => {
      const possibleVirtualMatchKey: VirtualMatchKey = { beatmapId: r.beatmapId, sameBeatmapNumber: r.sameBeatmapNumber };
      for (const targetReportableVirtualMatchKey of targetLeaderboardVirtualMatchKeys) {
        if (VirtualMatchCreator.isEqualVirtualMatchKey(targetReportableVirtualMatchKey, possibleVirtualMatchKey)) {
          return true;
        }
      }
      return false;
    });

    return beforeAndIncludingFinalLeaderboardReportables;
  }

  private static getAlreadyReportedItemsForGame(args: {
    virtualMatchReportDatas: VirtualMatchReportData[];
    game: Game;
  }): ReportableContext<ReportableContextType>[] {
    const reported: ReportableContext<ReportableContextType>[] = [];

    args.game.gameMatchesReported.forEach(gmr => {
      const reportedContext = gmr.reportedContext;

      args.virtualMatchReportDatas.forEach(vmrData => {
        if (reportedContext.type === "game_event") {
          if (
            vmrData.events &&
            vmrData.events.find(
              e =>
                e.type === reportedContext.subType &&
                e.data.eventMatch.beatmapId === reportedContext.beatmapId &&
                e.data.eventMatch.sameBeatmapNumber === reportedContext.sameBeatmapNumber
            )
          ) {
            reported.push(reportedContext);
          }
        } else if (reportedContext.type === "message") {
          const msgs = vmrData.messages.get(reportedContext.subType as MessageType);
          if (
            msgs &&
            msgs.find(
              m =>
                m.type === reportedContext.subType &&
                m.beatmapId === reportedContext.beatmapId &&
                m.sameBeatmapNumber === reportedContext.sameBeatmapNumber
            )
          ) {
            reported.push(reportedContext);
          }
        } else if (reportedContext.type === "leaderboard") {
          // get the virtual match key of the latest-reported virtual match from the already-reported reportables
          throw new Error("TODO: Implement method of MultiplayerResultsReporter.");
        } else {
          const _exhaustiveCheck: never = reportedContext.type;
        }
      });
    });

    return reported;
  }

  // /**
  //  * Returns virtual matches not containing any of the given real matches
  //  */
  // private static removeVirtualMatchesContainingRealMatches(args: { virtualMatches: VirtualMatch[]; realMatches: Match[] }): VirtualMatch[] {
  //   return args.virtualMatches.filter(vm => !vm.matches.some(vmm => args.realMatches.some(rm => vmm.id === rm.id)));
  // }
}

// function filterOutMessagesForReportedMatches(
//   reportedMatches: Match[]
// ): (value: LobbyBeatmapStatusMessage<MessageType>, index: number, array: LobbyBeatmapStatusMessage<MessageType>[]) => unknown {
//   return message => !reportedMatches.find(rm => message.match && message.match.entityId && message.match.entityId === rm.id);
// }
