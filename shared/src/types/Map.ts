import type { TerritoryId } from "./Ids";

export type Phase = "reinforcement" | "attack" | "fortify";

export type TerritoryDefinition = {
  id: TerritoryId;
  name: string;
  neighbors: TerritoryId[];
};

export type MapDefinition = {
  territories: TerritoryDefinition[];
};

export type TerritoryState = {
  ownerId: string | null;
  troops: number;
};
