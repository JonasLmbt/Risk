import type { MapDefinition } from "../types/Map";

/**
 * "World24" is a Risk-like map with 24 territories.
 * IDs are T01..T24.
 */
export const world24: MapDefinition = {
  id: "world24",
  name: "World 24",
  territories: [
    // North America (3)
    { id: "T01", name: "Northwest", neighbors: ["T02", "T03"] },
    { id: "T02", name: "Northeast", neighbors: ["T01", "T03", "T04"] },
    { id: "T03", name: "Midlands", neighbors: ["T01", "T02", "T04", "T05"] },
    // South America (3)
    { id: "T04", name: "Southeast", neighbors: ["T02", "T03", "T05"] },
    { id: "T05", name: "South Coast", neighbors: ["T03", "T04", "T06", "T11"] }, // connects to West Africa
    { id: "T06", name: "Southern", neighbors: ["T05"] },

    // Europe (4)
    { id: "T07", name: "Icelandic Ridge", neighbors: ["T08", "T10", "T02"] }, // sea-bridge from NE
    { id: "T08", name: "Western Europe", neighbors: ["T07", "T09", "T10", "T11"] },
    { id: "T09", name: "Eastern Europe", neighbors: ["T08", "T10", "T12", "T13"] },
    { id: "T10", name: "Northlands", neighbors: ["T07", "T08", "T09", "T14"] },

    // Africa (4)
    { id: "T11", name: "West Africa", neighbors: ["T08", "T12", "T15", "T05"] }, // connects to South Coast
    { id: "T12", name: "East Africa", neighbors: ["T11", "T09", "T13", "T15", "T16"] },
    { id: "T15", name: "South Africa", neighbors: ["T11", "T12", "T16"] },
    { id: "T16", name: "Madagascar Arc", neighbors: ["T12", "T15", "T22"] }, // connects to Oceania

    // Asia (8)
    { id: "T13", name: "Middle East", neighbors: ["T09", "T12", "T14", "T17"] },
    { id: "T14", name: "Steppe Gate", neighbors: ["T10", "T13", "T18", "T19"] },
    { id: "T17", name: "India", neighbors: ["T13", "T18", "T20"] },
    { id: "T18", name: "Central Asia", neighbors: ["T14", "T17", "T19", "T20"] },
    { id: "T19", name: "Siberia", neighbors: ["T14", "T18", "T21"] },
    { id: "T20", name: "Southeast Asia", neighbors: ["T17", "T18", "T21", "T22"] },
    { id: "T21", name: "Far East", neighbors: ["T19", "T20", "T23"] },
    { id: "T22", name: "Indonesia", neighbors: ["T20", "T16", "T24"] },

    // Oceania (2)
    { id: "T23", name: "Pacific Rim", neighbors: ["T21", "T24", "T02"] }, // long sea route to NE
    { id: "T24", name: "Australis", neighbors: ["T22", "T23"] }
  ],
  continents: [
    { id: "C1", name: "North America", bonus: 3, territories: ["T01", "T02", "T03"] },
    { id: "C2", name: "South America", bonus: 2, territories: ["T04", "T05", "T06"] },
    { id: "C3", name: "Europe", bonus: 3, territories: ["T07", "T08", "T09", "T10"] },
    { id: "C4", name: "Africa", bonus: 3, territories: ["T11", "T12", "T15", "T16"] },
    { id: "C5", name: "Asia", bonus: 5, territories: ["T13", "T14", "T17", "T18", "T19", "T20", "T21", "T22"] },
    { id: "C6", name: "Oceania", bonus: 2, territories: ["T23", "T24"] }
  ]
};
