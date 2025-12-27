import type { MapDefinition } from "../types/Map";

/**
 * Original, Risk-like world map with 42 territories.
 * This is NOT a reconstruction of the Hasbro board:
 * - Simplified geometry
 * - Slightly adjusted adjacency
 * - Intended for mechanics + analysis
 *
 * Territory IDs: T01..T42
 */
export const world42: MapDefinition = {
  territories: [
    // North America (9) - T01..T09
    { id: "T01", name: "Alaska", neighbors: ["T02", "T04", "T21"] },
    { id: "T02", name: "Northwest", neighbors: ["T01", "T03", "T04"] },
    { id: "T03", name: "Greenland", neighbors: ["T02", "T04", "T05", "T10"] },
    { id: "T04", name: "Alberta", neighbors: ["T01", "T02", "T03", "T05", "T06"] },
    { id: "T05", name: "Ontario", neighbors: ["T03", "T04", "T06", "T07"] },
    { id: "T06", name: "Western US", neighbors: ["T04", "T05", "T07", "T08"] },
    { id: "T07", name: "Eastern US", neighbors: ["T05", "T06", "T08"] },
    { id: "T08", name: "Central America", neighbors: ["T06", "T07", "T09"] },
    { id: "T09", name: "Caribbean Coast", neighbors: ["T08", "T13"] }, // custom connector into South America

    // South America (4) - T10..T13
    { id: "T10", name: "Venezuela", neighbors: ["T09", "T11", "T12"] },
    { id: "T11", name: "Peru", neighbors: ["T10", "T12", "T13"] },
    { id: "T12", name: "Brazil", neighbors: ["T10", "T11", "T13", "T19"] },
    { id: "T13", name: "Argentina", neighbors: ["T11", "T12"] },

    // Europe (7) - T14..T20
    { id: "T14", name: "Iceland", neighbors: ["T03", "T15", "T16"] },
    { id: "T15", name: "Great Britain", neighbors: ["T14", "T16", "T17"] },
    { id: "T16", name: "Scandinavia", neighbors: ["T14", "T15", "T18", "T21"] }, // custom link to Ural-like
    { id: "T17", name: "Western Europe", neighbors: ["T15", "T18", "T19", "T22"] },
    { id: "T18", name: "Northern Europe", neighbors: ["T16", "T17", "T19", "T20"] },
    { id: "T19", name: "Southern Europe", neighbors: ["T17", "T18", "T20", "T22", "T24"] },
    { id: "T20", name: "Eastern Europe", neighbors: ["T18", "T19", "T21", "T24", "T25"] },

    // Africa (6) - T21..T26
    { id: "T21", name: "North Africa", neighbors: ["T12", "T16", "T17", "T22", "T23"] }, // note: custom inter-continent for gameplay
    { id: "T22", name: "Egypt", neighbors: ["T17", "T19", "T21", "T24", "T23"] },
    { id: "T23", name: "Congo Basin", neighbors: ["T21", "T22", "T25", "T26"] },
    { id: "T24", name: "East Africa", neighbors: ["T20", "T22", "T25", "T26", "T33"] },
    { id: "T25", name: "South Africa", neighbors: ["T23", "T24", "T26"] },
    { id: "T26", name: "Madagascar", neighbors: ["T23", "T24", "T25", "T38"] }, // custom link into island chain

    // Asia (12) - T27..T38
    { id: "T27", name: "Ural Frontier", neighbors: ["T16", "T20", "T28", "T29"] },
    { id: "T28", name: "Siberia", neighbors: ["T27", "T29", "T30", "T31"] },
    { id: "T29", name: "Central Steppe", neighbors: ["T27", "T28", "T32", "T33"] },
    { id: "T30", name: "Yakut Highlands", neighbors: ["T28", "T31"] },
    { id: "T31", name: "Kamchatka", neighbors: ["T28", "T30", "T35", "T01"] }, // far route to Alaska (kept for recognizability)
    { id: "T32", name: "Mongolia", neighbors: ["T29", "T34", "T35"] },
    { id: "T33", name: "Afghan Corridor", neighbors: ["T24", "T29", "T34", "T36"] },
    { id: "T34", name: "Northern China", neighbors: ["T32", "T33", "T35", "T36"] },
    { id: "T35", name: "Japan Arc", neighbors: ["T31", "T32", "T34"] },
    { id: "T36", name: "India", neighbors: ["T33", "T34", "T37"] },
    { id: "T37", name: "Southeast Peninsula", neighbors: ["T36", "T38"] },
    { id: "T38", name: "Indonesian Seas", neighbors: ["T37", "T26", "T39", "T40"] },

    // Australia/Oceania (4) - T39..T42
    { id: "T39", name: "New Guinea", neighbors: ["T38", "T40"] },
    { id: "T40", name: "Western Australia", neighbors: ["T38", "T39", "T41"] },
    { id: "T41", name: "Eastern Australia", neighbors: ["T40", "T42"] },
    { id: "T42", name: "Tasman Reach", neighbors: ["T41"] }
  ]
};
