import type { PolymorphicProps } from "@kobalte/core";
import type { LinkRootProps } from "@kobalte/core/link";
import { A } from "@solidjs/router";
import type { VariantProps } from "class-variance-authority";
import { splitProps, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "@/lib/cn";
import { buttonVariants } from "./button";

type linkProps<T extends ValidComponent = typeof A> = LinkRootProps<T> &
  VariantProps<typeof buttonVariants> & {
    class?: string;
    href: string;
    absolute?: boolean;
  };

export const Link = <T extends ValidComponent = typeof A>(
  props: PolymorphicProps<T, linkProps<T>>,
) => {
  const [local, rest] = splitProps(props as linkProps, [
    "class",
    "variant",
    "size",
    "absolute",
  ]);

  return (
    <Dynamic
      component={local.absolute ? "a" : A}
      class={cn(
        buttonVariants({
          variant: local.variant ?? "link",
          size: local.size ?? "default",
        }),
        "justify-start",
        local.class,
      )}
      {...rest}
    />
  );
};
