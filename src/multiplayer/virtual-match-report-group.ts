import { GameEvent } from "./game-events/game-event";
import { LobbyBeatmapStatusMessageGroup } from "./lobby-beatmap-status-message";
import { VirtualMatchKey } from "./virtual-match-key";

export interface VirtualMatchReportGroup extends VirtualMatchKey {
  events?: GameEvent[];
  messages?: LobbyBeatmapStatusMessageGroup;
}
