import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "solid-js";
import { cn } from "@/lib/cn";
import { tablerIcons } from "./tablerIcons";

const variants = cva(
  "icon font-tabler-icons select-none text-center !leading-none relative data-[disabled=true]:opacity-75 aspect-square block",
  {
    variants: {
      size: {
        default:
          "text-base [&>*.sub-icon]:-bottom-[0.2em] [&>*.sub-icon]:-right-[0.3em]",
        xs: "text-xs [&>*.sub-icon]:-bottom-[0.5em] [&>*.sub-icon]:-right-[0.6em]",
        sm: "text-sm [&>*.sub-icon]:-bottom-[0.5em] [&>*.sub-icon]:-right-[0.6em]",
        md: "text-base [&>*.sub-icon]:-bottom-[0.5em] [&>*.sub-icon]:-right-[0.6em]",
        lg: "text-xl [&>*.sub-icon]:-bottom-[0.5em] [&>*.sub-icon]:-right-[0.6em]",
        xl: "text-3xl [&>*.sub-icon]:-bottom-[0.5em] [&>*.sub-icon]:-right-[0.6em]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export type IconProps = Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  "icon" | "color" | "children"
> &
  VariantProps<typeof variants> & {
    disabled?: boolean;
    iconId: keyof typeof tablerIcons;
    children?: (
      props: Pick<JSX.HTMLAttributes<HTMLElement>, "class">,
    ) => JSX.Element;
  };

export function Icon(props: IconProps) {
  return (
    <span
      {...props}
      role="img"
      class={cn(variants({ size: props.size }), props.class)}
      data-disabled={props.disabled}
    >
      {tablerIcons[props.iconId ?? "question-mark"]}
    </span>
  );
}
