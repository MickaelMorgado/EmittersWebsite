import { registerRoot, Composition } from "remotion";
import { MediaProcessorPromo } from "./Root";
import React from "react";

registerRoot(() => (
  <Composition
    id="MediaProcessorPromo"
    component={MediaProcessorPromo}
    durationInFrames={1170}
    fps={30}
    width={1920}
    height={1080}
  />
));
