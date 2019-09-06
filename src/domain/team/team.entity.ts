import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, OneToMany } from "typeorm";
import { User } from "../user/user.entity";
import { AbstractEntity } from "../shared/abstract-entity";
import { IsAlphanumeric, ValidateIf } from "class-validator";
import { GameTeam } from "./game-team.entity";
import { OsuUser } from "../user/osu-user.entity";

@Entity("teams")
export class Team extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ValidateIf(team => team.name)
  @IsAlphanumeric()
  @Column({ nullable: true })
  name: string;

  @ManyToOne(type => User)
  createdBy: User;

  @ManyToMany(type => OsuUser, osuUser => osuUser.teams)
  users: OsuUser[];

  @OneToMany(type => GameTeam, gameTeam => gameTeam.team)
  gameTeams: GameTeam[];
}
