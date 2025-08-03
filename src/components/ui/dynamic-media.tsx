import { createEffect, createResource, createSignal, type JSX, on, Show } from "solid-js";

type DynamicMediaProps = {
  src: string | File;
  alt?: string;
  class?: string;
  style?: JSX.CSSProperties;
  controls?: boolean;
  loop?: boolean;
  playsinline?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  onLoadStart?: () => void;
  onLoad?: () => void;
};

export default function DynamicMedia(props: DynamicMediaProps) {
  const [contentType] = createResource(
    () => {
      return props.src;
    },
    async (src) => {
      if (typeof src === "string") {
        const res = await fetch(src, { method: "HEAD" });
        return res.headers.get("Content-Type") ?? "";
      }

      return src.type;
    },
  );

  return (
    <Show
      when={contentType.latest}
      fallback={<div class={props.class} style={props.style} />}
    >
      <Show when={contentType.latest?.startsWith("image/")}>
        <img
          onLoad={props.onLoad}
          onLoadStart={props.onLoadStart}
          src={
            typeof props.src === "string"
              ? props.src
              : URL.createObjectURL(props.src)
          }
          alt={props.alt ?? "image"}
          class={props.class}
          style={props.style}
        />
      </Show>
      <Show when={contentType.latest?.startsWith("video/")}>
        <video
          controlslist="nodownload noplaybackrate"
          src={
            typeof props.src === "string"
              ? props.src
              : URL.createObjectURL(props.src)
          }
          muted={props.muted}
          controls={props.controls}
          autoplay={props.autoplay}
          loop={props.loop}
          playsinline={props.playsinline}
          preload="metadata"
          class={props.class}
          style={props.style}
          onCanPlay={props.onLoad}
          onLoadStart={props.onLoadStart}
        >
          Your browser does not support the video tag.
        </video>
      </Show>
    </Show>
  );
}
