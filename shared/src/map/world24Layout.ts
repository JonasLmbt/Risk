import type { TerritoryId } from "../types/Ids";

export type TerritoryPathLayout = {
  id: TerritoryId;
  d: string;       // SVG path (closed)
  labelX: number;
  labelY: number;
};

export const world24Layout: TerritoryPathLayout[] = [
  // Americas (left)
  { id: "T01", d: "M60 80 L140 55 L210 85 L185 140 L95 150 L55 115 Z", labelX: 85, labelY: 105 },
  { id: "T02", d: "M210 85 L295 70 L330 110 L300 160 L205 150 L185 140 Z", labelX: 235, labelY: 120 },
  { id: "T03", d: "M95 150 L205 150 L300 160 L290 220 L165 245 L85 210 Z", labelX: 155, labelY: 195 },
  { id: "T04", d: "M300 160 L360 155 L390 205 L345 250 L290 220 Z", labelX: 315, labelY: 210 },
  { id: "T05", d: "M165 245 L290 220 L345 250 L315 310 L205 330 L140 300 Z", labelX: 210, labelY: 285 },
  { id: "T06", d: "M205 330 L315 310 L340 365 L275 410 L210 385 Z", labelX: 240, labelY: 365 },

  // Europe/Africa (center)
  { id: "T07", d: "M455 75 L515 55 L560 75 L545 110 L485 115 Z", labelX: 485, labelY: 85 },
  { id: "T08", d: "M445 125 L515 120 L575 145 L560 200 L475 205 L430 165 Z", labelX: 465, labelY: 170 },
  { id: "T09", d: "M575 145 L650 135 L705 175 L680 230 L600 235 L560 200 Z", labelX: 610, labelY: 190 },
  { id: "T10", d: "M545 110 L600 95 L660 115 L650 135 L575 145 L515 120 Z", labelX: 575, labelY: 125 },

  { id: "T11", d: "M435 215 L505 215 L560 250 L540 310 L470 325 L420 280 Z", labelX: 455, labelY: 270 },
  { id: "T12", d: "M560 250 L635 245 L690 290 L650 350 L575 355 L540 310 Z", labelX: 585, labelY: 305 },
  { id: "T15", d: "M470 325 L540 310 L575 355 L555 420 L485 430 L445 380 Z", labelX: 485, labelY: 380 },
  { id: "T16", d: "M650 350 L715 345 L740 405 L700 450 L640 420 Z", labelX: 665, labelY: 405 },

  // Middle East + Steppe (bridge to Asia)
  { id: "T13", d: "M680 230 L735 220 L780 250 L760 295 L690 290 L635 245 Z", labelX: 700, labelY: 260 },
  { id: "T14", d: "M660 115 L740 110 L800 145 L790 195 L735 220 L680 230 L705 175 Z", labelX: 715, labelY: 165 },

  // Asia (right)
  { id: "T17", d: "M780 250 L850 245 L890 285 L860 340 L800 330 L760 295 Z", labelX: 805, labelY: 295 },
  { id: "T18", d: "M800 145 L875 140 L930 185 L905 240 L850 245 L790 195 Z", labelX: 835, labelY: 195 },
  { id: "T19", d: "M875 140 L965 135 L1010 175 L985 230 L930 185 Z", labelX: 905, labelY: 180 },
  { id: "T20", d: "M860 340 L930 330 L990 360 L965 415 L890 425 L845 380 Z", labelX: 885, labelY: 375 },
  { id: "T21", d: "M930 185 L985 230 L1040 255 L1025 310 L965 315 L905 240 Z", labelX: 960, labelY: 265 },
  { id: "T22", d: "M965 415 L1035 400 L1070 435 L1045 485 L985 490 L950 455 Z", labelX: 990, labelY: 450 },

  // Pacific + Oceania (far right / bottom right)
  { id: "T23", d: "M1040 255 L1115 245 L1165 290 L1135 340 L1065 335 L1025 310 Z", labelX: 1065, labelY: 295 },
  { id: "T24", d: "M1045 485 L1115 470 L1175 505 L1150 555 L1080 560 L1035 520 Z", labelX: 1070, labelY: 525 }
];
