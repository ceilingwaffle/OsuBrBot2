import { UserReportProperties } from "../shared/reports/user-report-properties.type";
import { Game } from "./game.entity";
import { GameMessageTarget } from "./game-message-target";
import { AbstractResponseFactory } from "../shared/abstract-response-factory";

export class GameResponseFactory extends AbstractResponseFactory<Game> {
  getCreator(): UserReportProperties {
    return this.getUserReportPropertiesForUser(this.subject.createdBy);
  }

  getEndedBy(): UserReportProperties {
    return this.getUserReportPropertiesForUser(this.subject.endedBy);
  }

  getReferees(): UserReportProperties[] {
    return this.subject.refereedBy.map(user => this.getUserReportPropertiesForUser(user));
  }

  getMessageTargets(): GameMessageTarget[] {
    // return [
    //   {
    //     commType: this.requestData.commType,
    //     // authorId: this.requestData.authorId,
    //     channelId: this.requestData.originChannelId
    //   }
    // ];
    return this.subject.messageTargets;
  }

  getCreatedAgoText(): string {
    return this.getTimeAgoTextForTime(this.subject.createdAt);
  }

  getEndedAgoText(): string {
    return this.getTimeAgoTextForTime(this.subject.endedAt);
  }
}
