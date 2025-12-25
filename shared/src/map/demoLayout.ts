import type { TerritoryId } from "../types/Ids";

export type TerritoryLayout = {
  id: TerritoryId;
  points: string; // SVG polygon points: "x,y x,y ..."
  labelX: number;
  labelY: number;
};

export const demoLayout: TerritoryLayout[] = [
  { id: "A", points: "20,20 180,20 180,120 20,120", labelX: 35, labelY: 55 },
  { id: "B", points: "200,20 360,20 360,120 200,120", labelX: 215, labelY: 55 },
  { id: "C", points: "380,20 540,20 540,120 380,120", labelX: 395, labelY: 55 },
  { id: "D", points: "560,20 720,20 720,120 560,120", labelX: 575, labelY: 55 },

  { id: "E", points: "20,140 180,140 180,240 20,240", labelX: 35, labelY: 175 },
  { id: "F", points: "200,140 360,140 360,240 200,240", labelX: 215, labelY: 175 },
  { id: "G", points: "380,140 540,140 540,240 380,240", labelX: 395, labelY: 175 },
  { id: "H", points: "560,140 720,140 720,240 560,240", labelX: 575, labelY: 175 }
];
