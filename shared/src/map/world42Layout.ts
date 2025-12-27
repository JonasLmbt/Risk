import type { TerritoryId } from "../types/Ids";

export type TerritoryPathLayout = {
  id: TerritoryId;
  d: string;      // SVG path (closed)
  labelX: number;
  labelY: number;
};

/**
 * Layout notes:
 * - Simplified polygon blocks arranged so continents are recognizable.
 * - Coordinates assume an SVG around ~1200x650.
 * - Shapes are intentionally NOT matching the original Risk board.
 */
export const world42Layout: TerritoryPathLayout[] = [
  // =========================
  // North America (left)
  // =========================
  { id: "T01", d: "M60 90 L150 70 L190 110 L140 155 L65 140 Z", labelX: 95, labelY: 115 },   // Alaska
  { id: "T02", d: "M150 70 L265 60 L290 110 L220 155 L190 110 Z", labelX: 195, labelY: 110 }, // Northwest
  { id: "T03", d: "M290 75 L385 60 L430 105 L395 150 L300 145 Z", labelX: 325, labelY: 110 }, // Greenland
  { id: "T04", d: "M170 160 L285 150 L300 200 L235 235 L165 210 Z", labelX: 205, labelY: 195 }, // Alberta
  { id: "T05", d: "M285 150 L395 150 L405 210 L330 240 L300 200 Z", labelX: 320, labelY: 200 }, // Ontario
  { id: "T06", d: "M165 210 L235 235 L225 295 L150 310 L120 255 Z", labelX: 150, labelY: 265 }, // Western US
  { id: "T07", d: "M235 235 L330 240 L325 305 L240 320 L225 295 Z", labelX: 250, labelY: 285 }, // Eastern US
  { id: "T08", d: "M150 310 L240 320 L240 365 L165 380 L130 350 Z", labelX: 165, labelY: 350 }, // Central America
  { id: "T09", d: "M245 330 L305 335 L320 370 L270 395 L240 365 Z", labelX: 265, labelY: 365 }, // Caribbean Coast

  // =========================
  // South America (lower-left)
  // =========================
  { id: "T10", d: "M255 400 L335 395 L360 440 L320 485 L255 470 Z", labelX: 275, labelY: 445 }, // Venezuela
  { id: "T11", d: "M250 470 L320 485 L315 545 L255 560 L225 515 Z", labelX: 250, labelY: 525 }, // Peru
  { id: "T12", d: "M320 485 L390 465 L420 520 L380 585 L315 545 Z", labelX: 345, labelY: 530 }, // Brazil
  { id: "T13", d: "M255 560 L315 545 L380 585 L330 630 L260 630 Z", labelX: 285, labelY: 605 }, // Argentina

  // =========================
  // Europe (upper-center)
  // =========================
  { id: "T14", d: "M500 90 L545 75 L575 95 L560 125 L515 125 Z", labelX: 515, labelY: 105 }, // Iceland
  { id: "T15", d: "M485 140 L535 135 L555 170 L520 200 L485 175 Z", labelX: 495, labelY: 175 }, // Great Britain
  { id: "T16", d: "M560 125 L620 115 L650 145 L630 185 L575 175 Z", labelX: 585, labelY: 155 }, // Scandinavia
  { id: "T17", d: "M495 215 L560 205 L580 245 L545 280 L495 260 Z", labelX: 505, labelY: 250 }, // Western Europe
  { id: "T18", d: "M580 205 L645 195 L670 235 L635 275 L580 245 Z", labelX: 600, labelY: 240 }, // Northern Europe
  { id: "T19", d: "M545 280 L635 275 L660 315 L610 350 L545 335 Z", labelX: 565, labelY: 315 }, // Southern Europe
  { id: "T20", d: "M670 235 L745 225 L770 265 L735 310 L660 315 Z", labelX: 690, labelY: 270 }, // Eastern Europe

  // =========================
  // Africa (center-lower)
  // =========================
  { id: "T21", d: "M520 355 L610 350 L650 390 L620 435 L535 435 L500 395 Z", labelX: 535, labelY: 400 }, // North Africa
  { id: "T22", d: "M650 390 L710 375 L740 410 L715 455 L660 450 L620 435 Z", labelX: 665, labelY: 425 }, // Egypt
  { id: "T23", d: "M535 435 L660 450 L670 505 L600 545 L525 510 Z", labelX: 555, labelY: 495 }, // Congo Basin
  { id: "T24", d: "M715 455 L780 445 L800 505 L760 555 L670 505 Z", labelX: 725, labelY: 505 }, // East Africa
  { id: "T25", d: "M600 545 L760 555 L735 620 L625 625 L575 585 Z", labelX: 635, labelY: 595 }, // South Africa
  { id: "T26", d: "M820 560 L860 545 L885 575 L865 615 L830 610 Z", labelX: 830, labelY: 590 }, // Madagascar

  // =========================
  // Asia (right)
  // =========================
  { id: "T27", d: "M770 210 L840 205 L865 245 L830 285 L770 265 Z", labelX: 785, labelY: 250 }, // Ural Frontier
  { id: "T28", d: "M865 185 L955 175 L990 215 L955 260 L865 245 Z", labelX: 895, labelY: 220 }, // Siberia
  { id: "T29", d: "M830 285 L905 275 L930 320 L890 360 L820 345 Z", labelX: 845, labelY: 325 }, // Central Steppe
  { id: "T30", d: "M955 145 L1040 140 L1065 175 L1035 210 L990 215 Z", labelX: 985, labelY: 185 }, // Yakut Highlands
  { id: "T31", d: "M1040 140 L1125 155 L1145 200 L1095 230 L1035 210 Z", labelX: 1070, labelY: 195 }, // Kamchatka
  { id: "T32", d: "M930 320 L1005 315 L1030 355 L990 395 L930 385 Z", labelX: 950, labelY: 360 }, // Mongolia
  { id: "T33", d: "M770 360 L850 350 L890 390 L855 435 L780 425 Z", labelX: 790, labelY: 395 }, // Afghan Corridor
  { id: "T34", d: "M890 390 L990 395 L1010 445 L945 480 L855 435 Z", labelX: 900, labelY: 440 }, // Northern China
  { id: "T35", d: "M1095 230 L1160 245 L1165 295 L1115 315 L1085 275 Z", labelX: 1105, labelY: 275 }, // Japan Arc
  { id: "T36", d: "M820 445 L905 440 L945 480 L900 525 L825 515 Z", labelX: 835, labelY: 490 }, // India
  { id: "T37", d: "M945 480 L1040 470 L1060 520 L1005 555 L900 525 Z", labelX: 960, labelY: 515 }, // Southeast Peninsula
  { id: "T38", d: "M1005 555 L1085 540 L1120 575 L1095 620 L1025 625 L990 590 Z", labelX: 1020, labelY: 590 }, // Indonesian Seas

  // =========================
  // Australia / Oceania (bottom-right)
  // =========================
  { id: "T39", d: "M1120 500 L1180 490 L1200 525 L1165 555 L1115 540 Z", labelX: 1125, labelY: 530 }, // New Guinea
  { id: "T40", d: "M1030 635 L1110 625 L1140 660 L1105 705 L1035 695 Z", labelX: 1045, labelY: 670 }, // Western Australia
  { id: "T41", d: "M1110 625 L1195 620 L1225 665 L1185 710 L1140 660 Z", labelX: 1135, labelY: 670 }, // Eastern Australia
  { id: "T42", d: "M1165 720 L1210 715 L1235 745 L1205 770 L1165 760 Z", labelX: 1168, labelY: 745 }  // Tasman Reach
];
