import { ReactiveSet } from "@solid-primitives/set";
import { keyBy, mapValues } from "lodash-es";
import { type Accessor, batch, createEffect, createMemo, on } from "solid-js";
import { createStore } from "solid-js/store";
import {
  type ErrorMessage,
  flatten,
  type InferInput,
  type InferOutput,
  type ObjectEntries,
  type ObjectIssue,
  type ObjectSchema,
  safeParse,
} from "valibot";

export type FormField<ValueT = unknown> = {
  issue: string | undefined;
  state: "valid" | "invalid";
  value: ValueT | undefined;
  set: (v: ValueT) => void;
};

export function createForm<
  EntriesT extends ObjectEntries,
  TMessage extends ErrorMessage<ObjectIssue> | undefined,
  SchemaT extends ObjectSchema<EntriesT, TMessage>,
>(schema: SchemaT, defaultValue: Accessor<InferInput<SchemaT>>) {
  const keys = Object.keys(schema.entries);

  const [value, setValue] = createStore<Partial<InferInput<SchemaT>>>(
    defaultValue(),
  );
  const touchedFields = new ReactiveSet();
  createEffect(
    on(
      () => defaultValue(),
      (defaultValue) => {
        batch(() => {
          for (const key of keys) {
            setValue(key as any, defaultValue[key] as any);
          }
          touchedFields.clear();
        });
      },
    ),
  );

  const validation = createMemo(() => safeParse(schema, value));
  const issues = createMemo(() => {
    const issues = validation().issues;
    return issues ? flatten<typeof schema>(issues) : {};
  });

  const fields = mapValues(
    keyBy(keys, (x) => x),
    (def, key) => {
      const issue = () =>
        touchedFields.has(key) || !!value[key]
          ? (issues().nested as Record<string, string[]>)?.[key]?.[0]
          : undefined;

      const state = () => (issue() ? ("invalid" as const) : ("valid" as const));
      return {
        get issue() {
          return issue();
        },
        get state() {
          return state();
        },
        get value() {
          return value[key];
        },
        set: (fieldValue: any) => {
          setValue(key as any, fieldValue as any);
          touchedFields.add(key);
        },
        reset: () => {
          setValue(key as any, def as any);
          touchedFields.delete(key);
        },
        get touched() {
          return touchedFields.has(key);
        },
      };
    },
  ) as {
      [K in keyof Required<InferInput<SchemaT>>]: FormField<
        InferInput<SchemaT>[K]
      >;
    };

  const result = () =>
    validation().success
      ? (validation().output as InferOutput<SchemaT>)
      : undefined;
  const isValid = () => validation().success;

  return {
    get isValid() {
      return isValid();
    },
    fields,
    get result() {
      return result();
    },
  };
}
