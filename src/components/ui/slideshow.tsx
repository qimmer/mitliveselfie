import { createEffect, createSignal, onCleanup } from "solid-js";
import { cn } from "~/lib/cn";
import DynamicMedia from "./dynamic-media";

export default function Slideshow(props: { class?: string, srcs: string[], duration: number, value: number, onValueChange: (value: number) => void }) {
  const [opacity, setOpacity] = createSignal(1);
  let timer: ReturnType<typeof setInterval>;

  createEffect(() => {
    timer = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        props.onValueChange?.(((props.value ?? 0) + 1) % props.srcs.length);
      }, 750); // fade duration
    }, (props.duration || 4000) + 2000);
  });

  onCleanup(() => clearInterval(timer));

  const current = () => props.srcs[props.value];

  return (
    <div class={cn("overflow-hidden flex flex-col items-center justify-center bg-black max-w-full max-h-full size-full", props.class)}>
      <DynamicMedia src={current()} style={{ opacity: opacity() }} class="absolute size-full inset-0 object-contain transition-opacity duration-500 bg-black" autoplay playsinline loop muted
        onLoad={() => setOpacity(1)} />
    </div>
  );
}