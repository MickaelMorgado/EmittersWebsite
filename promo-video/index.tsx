import { registerRoot, Composition } from "remotion";
import { ImageCompressorPromo } from "./Root";

registerRoot(() => (
  <Composition
    id="ImageCompressorPromo"
    component={ImageCompressorPromo}
    durationInFrames={690}
    fps={30}
    width={1920}
    height={1080}
  />
));
