import type { MapDefinition } from "../types/Map";

/**
 * Original, Risk-like world map with 42 territories.
 * This is NOT a reconstruction of the Hasbro board:
 * - Slightly adjusted adjacency
 */

export const world42: MapDefinition = {
  id: "world42",
  name: "World 42",
  territories: [
    // North America (9) - T00..T08
    { id: "T00", name: "Alaska", neighbors: ["T01", "T05", "T405"] },
    { id: "T01", name: "Alberta", neighbors: ["T00", "T05", "T06", "T08"] },
    { id: "T02", name: "Central America", neighbors: ["T03", "T08", "T13"] },
    { id: "T03", name: "Eastern US", neighbors: ["T02", "T06", "T07", "T08"] },
    { id: "T04", name: "Greenland", neighbors: ["T05", "T06", "T07", "T21"] },
    { id: "T05", name: "Northwest Territory", neighbors: ["T00", "T01", "T04", "T06"] },
    { id: "T06", name: "Ontario", neighbors: ["T01", "T03", "T04", "T05", "T07", "T08"] },
    { id: "T07", name: "Quebec", neighbors: ["T03", "T04", "T06"] },
    { id: "T08", name: "Western US", neighbors: ["T01", "T02", "T03", "T06"] }, 

    // South America (4) - T10..T13
    { id: "T10", name: "Argentina", neighbors: ["T11", "T12"] },
    { id: "T11", name: "Brazil", neighbors: ["T10", "T12", "T13", "T34"] },
    { id: "T12", name: "Peru", neighbors: ["T10", "T11", "T13"] },
    { id: "T13", name: "Venezuela", neighbors: ["T02", "T11", "T12"] },

    // Europe (7) - T20..T26
    { id: "T20", name: "Great Britain", neighbors: ["T21", "T22", "T23", "T26"] },
    { id: "T21", name: "Iceland", neighbors: ["T20", "T23", "T04"] },
    { id: "T22", name: "Northern Europe", neighbors: ["T20", "T23", "T24", "T25", "T26"] }, 
    { id: "T23", name: "Scandinavia", neighbors: ["T20", "T21", "T22", "T25"] },
    { id: "T24", name: "Southern Europe", neighbors: ["T22", "T25", "T26", "T32", "T34"] },
    { id: "T25", name: "Ukraine", neighbors: ["T22", "T23", "T24", "T400", "T406", "T410"] },
    { id: "T26", name: "Western Europe", neighbors: ["T20", "T22", "T24", "T34"] },

    // Africa (6) - T30..T35
    { id: "T30", name: "Congo", neighbors: ["T31", "T32", "T34", "T35"] }, 
    { id: "T31", name: "East Africa", neighbors: ["T30", "T32", "T33", "T34", "T35", "T406"] },
    { id: "T32", name: "Egypt", neighbors: ["T31", "T34", "T24", "T406"] },
    { id: "T33", name: "Madagascar", neighbors: ["T31", "T35"] },
    { id: "T34", name: "North Africa", neighbors: ["T30", "T31", "T32", "T11", "T24", "T26"] },
    { id: "T35", name: "South Africa", neighbors: ["T30", "T31", "T33"] },

    // Asia (12) - T400..T411
    { id: "T400", name: "Afghanistan", neighbors: ["T401", "T402", "T406", "T410", "T25"] },
    { id: "T401", name: "China", neighbors: ["T400", "T402", "T407", "T408", "T409", "T410"] },
    { id: "T402", name: "India", neighbors: ["T400", "T401", "T406", "T408"] },
    { id: "T403", name: "Irkutsk", neighbors: ["T405", "T407", "T409", "T411"] },
    { id: "T404", name: "Japan", neighbors: ["T405", "T407"] }, 
    { id: "T405", name: "Kamchatka", neighbors: ["T403", "T407", "T411", "T00"] },
    { id: "T406", name: "Middle East", neighbors: ["T400", "T402", "T24", "T25", "T31", "T32"] },
    { id: "T407", name: "Mongolia", neighbors: ["T401", "T403", "T404", "T409"] },
    { id: "T408", name: "Siam", neighbors: ["T401", "T402", "T51"] },
    { id: "T409", name: "Siberia", neighbors: ["T401", "T403", "T407", "T410", "T411"] },
    { id: "T410", name: "Ural", neighbors: ["T400", "T401", "T409", "T25"] },
    { id: "T411", name: "Yakutsk", neighbors: ["T403", "T405", "T409"] },

    // Australia/Oceania (4) - T50..T53
    { id: "T50", name: "Eastern Australia", neighbors: ["T52", "T53"] },
    { id: "T51", name: "Indonesia", neighbors: ["T52", "T53", "T408"] },
    { id: "T52", name: "New Guinea", neighbors: ["T50", "T51"] },
    { id: "T53", name: "Western Australia", neighbors: ["T50", "T51"] }
  ],
  continents: [
  { id: "C1", name: "North America", bonus: 5, territories: ["T00","T01","T02","T03","T04","T05","T06","T07","T08"] },
  { id: "C2", name: "South America", bonus: 2, territories: ["T10","T11","T12","T13"] },
  { id: "C3", name: "Europe",        bonus: 5, territories: ["T20","T21","T22","T23","T24","T25","T26"] },
  { id: "C4", name: "Africa",        bonus: 3, territories: ["T30","T31","T32","T33","T34","T35"] },
  { id: "C5", name: "Asia",          bonus: 7, territories: ["T400","T401","T402","T403","T404","T405","T406","T407","T408","T409","T410","T411"] },
  { id: "C6", name: "Australia",     bonus: 2, territories: ["T50","T51","T52","T53"] }
  ]
};
