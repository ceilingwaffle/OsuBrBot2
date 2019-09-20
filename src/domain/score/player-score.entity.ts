import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from "typeorm";
import { CreationTimestampedEntity } from "../shared/creation-timestamped-entity";
import { IsInt } from "class-validator";
import { OsuUser } from "../user/osu-user.entity";
import { Match } from "../match/match.entity";

@Entity("player_scores")
export class PlayerScore extends CreationTimestampedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @IsInt()
  @Column({ readonly: true, nullable: false })
  score: number;

  @ManyToOne(type => OsuUser, { cascade: ["insert", "update"] }) // , osuUser => osuUser.playerScores
  @JoinColumn({ name: "scored_by_osu_user_id" })
  scoredBy: OsuUser;

  @ManyToOne(type => Match)
  @JoinColumn({ name: "scored_in_match_id" })
  scoredInMatch: Match;

  @Column({ default: false, nullable: false })
  ignored: boolean;

  @Column({ readonly: true, nullable: false })
  passed: boolean;
}
