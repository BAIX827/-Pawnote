import React from "react";
import type { IconProps } from "./Icon";

// Inline vectors keep web navigation independent of font downloads.
const paths: Partial<Record<IconProps["name"], string>> = {
  plus: "M12 4v16M4 12h16",
  x: "m5 5 14 14M19 5 5 19",
  check: "m4 12 5 5L20 6",
  "arrow-right": "M3 12h18m-7-7 7 7-7 7",
  "arrow-left": "M21 12H3m7-7-7 7 7 7",
  mail: "M3 5h18v14H3zm0 0 9 8 9-8",
  "arrow-up-right": "M6 18 18 6M6 6h12v12",
  upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
  download: "M12 3v13m-5-5 5 5 5-5M4 15v6h16v-6",
  camera: "M3 7h5l2-3h4l2 3h5v13H3ZM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  image: "M3 3h18v18H3Zm0 14 6-6 4 4 4-5 4 7M9 7h.01",
  "file-text": "M4 2h10l6 6v14H4Zm10 0v6h6M8 12h8M8 16h8",
  "book-open": "M12 5v16M12 5C9 2 5 3 2 4v16c4-2 7-2 10 1 3-3 6-3 10-1V4c-3-1-7-2-10 1",
  "trash-2": "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  "edit-2": "m4 16-1 5 5-1L21 7l-4-4ZM14 6l4 4",
  "edit-3": "m4 16-1 5 5-1L21 7l-4-4ZM14 6l4 4M12 21h9",
  zap: "m13 2-9 12h7l-1 8 10-12h-7Z",
  "refresh-cw": "M20 8a9 9 0 0 0-15-3L2 8m0-5v5h5M4 16a9 9 0 0 0 15 3l3-3m0 5v-5h-5",
  "trending-up": "m3 17 6-6 4 4 8-10M15 5h6v6",
  sun: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2",
  moon: "M21 14A9 9 0 1 1 10 3c-3 8 3 14 11 11Z",
  briefcase: "M3 7h18v14H3Zm5 0V3h8v4M3 12h18M10 11v3h4v-3",
  "message-circle": "M21 11a9 9 0 0 1-13 8l-6 3 2-6A9 9 0 1 1 21 11Z",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2c0-7 16-7 16 0v2",
  coffee: "M3 7h13v10c0 5-13 5-13 0ZM16 8h2c5 0 5 6 0 6h-2M2 22h18M5 1v3M9 1v3M13 1v3",
  lock: "M5 11h14v10H5Zm3 0V7a4 4 0 0 1 8 0v4",
  flag: "M4 22V3m0 1c6-3 9 3 16 0v11c-7 3-10-3-16 0",
  "map-pin": "M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13Zm3-13a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  "chevron-down": "m6 9 6 6 6-6",
  "chevron-up": "m6 15 6-6 6 6",
  "hard-drive": "M2 13h20v7H2Zm0 0 4-9h12l4 9M6 17h.01M10 17h.01",
  book: "M5 3h15v15H5a2 2 0 0 0 0 4h15M5 3a2 2 0 0 0-2 2v15",
  home: "M3 11 12 3l9 8v10h-6v-7H9v7H3Z",
  repeat: "m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3",
  globe: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12l2-1-2-4-2 1-2-1V4h-4v3L9 8 7 7 5 11l2 1v0l-2 1 2 4 2-1 2 1v3h4v-3l2-1 2 1 2-4Z",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  "bell-off": "M13.7 21a2 2 0 0 1-3.4 0M18.6 13A17 17 0 0 1 18 8M6.3 6.3A6 6 0 0 0 6 8c0 7-3 9-3 9h14M9 3.5A6 6 0 0 1 18 8M1 1l22 22",
  feather: "M20 4C14-2 7 7 5 13l-3 9 9-3C17 17 26 10 20 4ZM5 19 18 6M8 11h5v5",
};
export default function Icon({ name, size = 20, color = "#263830" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
    <path d={paths[name] ?? paths.feather} />
  </svg>;
}
