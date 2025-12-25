import type { MapDefinition } from "../types/Map";

export const demoMap: MapDefinition = {
  territories: [
    { id: "A", name: "Alpha", neighbors: ["B", "D"] },
    { id: "B", name: "Beta", neighbors: ["A", "C"] },
    { id: "C", name: "Gamma", neighbors: ["B", "F"] },
    { id: "D", name: "Delta", neighbors: ["A", "E"] },
    { id: "E", name: "Epsilon", neighbors: ["D", "F", "H"] },
    { id: "F", name: "Zeta", neighbors: ["C", "E", "G"] },
    { id: "G", name: "Eta", neighbors: ["F", "H"] },
    { id: "H", name: "Theta", neighbors: ["E", "G"] }
  ]
};
