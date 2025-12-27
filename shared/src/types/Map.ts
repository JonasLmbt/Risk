import type { TerritoryId, ContinentId } from "./Ids";

export type TerritoryDefinition = {
  id: TerritoryId;
  name: string;
  neighbors: TerritoryId[];
};

export type TerritoryState = {
  name: string;
  ownerId: string | null;
  troops: number;
};

export type Continent = {
  id: ContinentId;           
  name: string;        
  bonus: number;       
  territories: TerritoryId[];
};

export type ContinentState = {
  name: string;
  ownerId: string | null;
};
export type MapDefinition = {
  id: string;
  name: string;
  territories: TerritoryDefinition[];
  continents: Continent[];
};