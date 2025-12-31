import type { GameState, TerritoryId, BoardMode } from "@risk/shared";

export type BoardProps = {
  game: GameState;
  playerId: string | null;

  mode: BoardMode;

  // attack
  attackFrom: TerritoryId | null;
  attackTo: TerritoryId | null;

  // fortify
  fortifyFrom: TerritoryId | null;
  fortifyTo: TerritoryId | null;

  // selection callback
  onTerritoryClick: (id: TerritoryId) => void;
  onAttack?: (from: TerritoryId, to: TerritoryId) => void;
};

export type ViewBox = { x: number; y: number; w: number; h: number };

export type TerritoryUi = {
  clickable: boolean;
  opacity: number;
  selected: boolean;
};

export type TerritoryRenderModel = {
  id: TerritoryId;
  d: string;
  labelX?: number;
  labelY?: number;

  visible: boolean;
  blocked: boolean;

  fill: string;
  opacity: number;
  selected: boolean;
  clickable: boolean;
  hoverable: boolean;

  troopsText: string;
  stroke: string;
  strokeWidth: number;
};
