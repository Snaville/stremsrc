import { addonBuilder, ContentType, Manifest, Stream } from "stremio-addon-sdk";
import { getStreamContent as getVidsrcStreams } from "./extractor";

const manifest: Manifest = {
  id: "xyz.theditor.stremsrc",
  version: "0.2.0",
  catalogs: [],
  resources: [
    {
      name: "stream",
      types: ["movie", "series"],
      idPrefixes: ["tt"],
    },
  ],
  types: ["movie", "series"],
  name: "stremsrc",
  description: "A VidSRC extractor for stremio",
};

const builder = new addonBuilder(manifest);

export const addonFn = async ({
  type,
  id
}: {
  type: ContentType;
  id: string;
}): Promise<{
  streams: Stream[];
}> => {
  try {
    const streams = await getVidsrcStreams(id, type);
    return { streams: streams ?? [] };
  } catch (error) {
    console.error("Stream extraction failed:", error);
    return { streams: [] };
  }
};

builder.defineStreamHandler(addonFn);

export default builder.getInterface();
