import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export function MarkdownContainer(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      class={cn(
        "block **:font-inter **:tracking-tight [&_h1]:text-5xl [&_h1]:font-bold [&_h2]:text-3xl [&_h3]:text-2xl [&_h4]:text-xl whitespace-pre-wrap leading-normal [&_ul]:list-disc [&_ul]:list-inside [&_ul]:leading-none [&_a]:text-accent [&_strong]:font-extrabold",
        props.class,
      )}
    />
  );
}
