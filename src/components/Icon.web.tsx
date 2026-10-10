import React from "react";
import type { IconProps } from "./Icon";

// Inline vectors keep web navigation independent of font downloads.
const paths: Partial<Record<IconProps["name"], string>> = {
  plus: "M12 4v16M4 12h16",
  x: "m5 5 14 14M19 5 5 19",
  check: "m4 12 5 5L20 6",
  "arrow-right": "M3 12h18m-7-7 7 7-7 7",
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
  feather: "M20 4C14-2 7 7 5 13l-3 9 9-3C17 17 26 10 20 4ZM5 19 18 6M8 11h5v5",
};
export default function Icon({ name, size = 20, color = "#263830" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
    <path d={paths[name] ?? paths.feather} />
  </svg>;
}
