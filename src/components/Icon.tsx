import React from "react";
import Feather from "@expo/vector-icons/Feather";
export type IconProps = {
  name: React.ComponentProps<typeof Feather>["name"];
  size?: number;
  color?: string;
};
export default function Icon({ name, size = 20, color = "#263830" }: IconProps) {
  return <Feather name={name} size={size} color={color} />;
}
