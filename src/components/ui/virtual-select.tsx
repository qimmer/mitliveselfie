import type { PolymorphicProps } from "@kobalte/core";
import type {
  PopoverRootProps,
  PopoverTriggerProps,
} from "@kobalte/core/popover";
import { VirtualList } from "@solid-primitives/virtual";
import {
  createContext,
  createSignal,
  type JSX,
  mergeProps,
  type Signal,
  splitProps,
  useContext,
  type ValidComponent,
} from "solid-js";
import { cn } from "~/lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type VirtualSelectContext<ItemT> = {
  options: () => ItemT[];
  value: () => string | undefined;
  onChange: (value: string | undefined) => void;
  optionTitle: (value: ItemT) => JSX.Element;
  optionValue: (value: ItemT) => string | undefined;
  height: () => number;
  rowHeight: () => number;
  open: Signal<boolean>;
};

const VirtualSelectContext = createContext<VirtualSelectContext<unknown>>();

export function VirtualSelect<ItemT>(
  props: PopoverRootProps & {
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    optionTitle: (value: ItemT) => JSX.Element;
    optionValue: (value: ItemT) => string | undefined;
    options: ItemT[];
    height: number;
    rowHeight: number;
  },
) {
  const [open, setOpen] = createSignal(false);
  const [local, rest] = splitProps(props, [
    "value",
    "onChange",
    "optionTitle",
    "optionValue",
    "options",
    "height",
    "rowHeight",
  ]);

  return (
    <VirtualSelectContext.Provider
      value={
        {
          height: () => local.height,
          onChange: local.onChange,
          options: () => local.options,
          optionTitle: local.optionTitle,
          optionValue: local.optionValue,
          rowHeight: () => local.rowHeight,
          value: () => local.value,
          open: [open, setOpen],
        } as VirtualSelectContext<unknown>
      }
    >
      <Popover open={open()} onOpenChange={setOpen} {...rest}>
        {props.children}
      </Popover>
    </VirtualSelectContext.Provider>
  );
}

export function VirtualSelectTrigger<T extends ValidComponent = "button">(
  props: PolymorphicProps<T, PopoverTriggerProps<T>>,
) {
  const context = useContext(VirtualSelectContext)!;

  return (
    <PopoverTrigger {...props}>
      {context.value()
        ? context.optionTitle(
            context
              .options()
              .find((x) => context.optionValue(x) === context.value()),
          )
        : props.children}
    </PopoverTrigger>
  );
}

export function VirtualSelectContent<ItemT>(
  _props: JSX.HTMLAttributes<HTMLDivElement>,
) {
  const context = useContext(VirtualSelectContext)!;

  return (
    <PopoverContent class="flex flex-col items-stretch p-0">
      <VirtualList
        each={context.options() as ItemT[]}
        overscanCount={10}
        rootHeight={context.height()}
        rowHeight={context.rowHeight()}
      >
        {(item) => (
          <VirtualSelectItem value={context.optionValue(item)}>
            {context.optionTitle(
              context
                .options()
                .find(
                  (x) => context.optionValue(x) === context.optionValue(item),
                ),
            )}
          </VirtualSelectItem>
        )}
      </VirtualList>
    </PopoverContent>
  );
}

function VirtualSelectItem(
  props: JSX.HTMLAttributes<HTMLButtonElement> & { value: string | undefined },
) {
  const context = useContext(VirtualSelectContext)!;

  return (
    <button
      {...mergeProps(
        {
          onClick: () => {
            context.onChange(props.value);
            context.open[1](false);
          },
          style: {
            "max-height": `${context.rowHeight()}px`,
            "min-height": `${context.rowHeight()}px`,
            height: `${context.rowHeight()}px`,
          },
        },
        props,
      )}
      type="button"
      class={cn(
        "w-full bg-transparent border-none p-2 cursor-pointer rounded hover:bg-popover overflow-hidden",
        props.class,
      )}
    >
      {props.children}
    </button>
  );
}
