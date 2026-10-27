import { Image } from "react-native";

// The "larga!" wordmark (assets/images/Logo is the designer's source; the PNGs are cut from its SVG).
// Its stripe masks are painted in the app background colour, so it sits seamlessly on bg-background only.
const source = require("../../assets/images/larga-wordmark.png");
const ASPECT = 1344 / 514;

export function Wordmark({ width = 240 }: { width?: number }) {
  return (
    <Image
      source={source}
      accessibilityLabel="Larga"
      resizeMode="contain"
      style={{ width, height: width / ASPECT }}
    />
  );
}
