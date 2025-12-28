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

export type MapLayout = {
  territories: TerritoryPathLayout[];
  continents?: ContinentLayout[];
  lines?: LineLayout[];
  backgroundImage?: string;
  backgroundColor?: string;
};

export type LineLayout = {
  id: string;
  d: string; // SVG path
  style?: "dashed" | "solid";
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
};

export type ContinentLayout = {
  id: ContinentId;
  d: string; // SVG path (closed)
};

export type TerritoryPathLayout = {
  id: TerritoryId;
  d: string;      // SVG path (closed)
  labelX?: number; 
  labelY?: number;
};
