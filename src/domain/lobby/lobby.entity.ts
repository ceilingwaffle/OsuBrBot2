import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne } from "typeorm";
import { IsNumberString } from "class-validator";
import { Game } from "../game/game.entity";
import { LobbyStatus } from "./lobby-status";
import { User } from "../user/user.entity";
import { Type } from "class-transformer";
import { AbstractEntity } from "../shared/abstract-entity";

@Entity("lobbies")
export class Lobby extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @IsNumberString()
  @Type(() => Number)
  @Column()
  banchoMultiplayerId: string;

  /**
   * Status of the lobby. Should be in-sync with the Bancho lobby status.
   *
   * @type {LobbyStatus}
   */
  @Column({ default: LobbyStatus.UNKNOWN })
  status: LobbyStatus;

  @ManyToMany(type => Game, game => game.lobbies)
  games: Game[];

  @ManyToOne(type => User)
  addedBy: User;
}
