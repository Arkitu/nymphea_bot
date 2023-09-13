import { client as gradioClient } from "@gradio/client";

export default async function getEmojiFromName(name: string) {
    const app = await gradioClient("https://easrng-text-to-emoji.hf.space/", {});
    return ((await app.predict("/predict", [name])) as any).data[0] as string;
}