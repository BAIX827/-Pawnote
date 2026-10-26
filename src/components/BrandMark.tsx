import { Image } from "react-native";

// Use the same artwork as app.json's icon and web favicon.
const appIcon = require("../../assets/pawnote-icon-final.png");

export default function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <Image
      accessible={false}
      source={appIcon}
      resizeMode="contain"
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
    />
  );
}
