import { createAsync, useAction, useParams } from "@solidjs/router";
import { createSignal, Match, Show, Switch } from "solid-js";
import { Button } from "~/components/ui/button";
import DynamicMedia from "~/components/ui/dynamic-media";
import { Icon } from "~/components/ui/icon";
import { getEvent } from "~/server/getEvent";
import { uploadImage } from "~/server/uploadImage";
import { t } from "~/t";

export default () => {
  const params = useParams();
  const event = createAsync(async () => await getEvent(params.id));

  const [file, setFile] = createSignal<File>();
  const [state, setState] = createSignal<"draft" | "saving" | "saved" | "error">();

  let fileInputRef: HTMLInputElement | undefined;

  const openCamera = () => {
    fileInputRef?.click();
  };

  return (
    <div class="flex flex-col items-center gap-12 p-4 max-w-[800px]">
      <div class="flex flex-col items-center justify-center gap-8 max-w-full">
        <h2 class="text-4xl font-bold text-center">{event()?.title}</h2>
        <h1 class="text-lg font-semibold">{t.title}</h1>
      </div>
      <button type="button" class="flex flex-col items-stretch self-center w-[80dvw] max-w-[400px] aspect-square rounded-xl border shadow-lg overflow-hidden cursor-pointer select-none" onClick={openCamera}>
        <Show when={file()} fallback={
          <div class="flex flex-col gap-4 flex-1 items-center justify-center">
            <Icon iconId="photo" size="xl" />
            <span class="font-medium text-3xl">{t.takePicture}</span>
          </div>
        }>
          <DynamicMedia
            src={file() ?? ""}
            alt="picture"
            class="flex-1 object-cover"
            autoplay
            loop
            muted
            playsinline
          />
        </Show>
      </button>

      <Show when={file()}>
        <div class="flex flex-col items-stretch gap-4 w-full">
          <Button
            class="w-full"
            variant="outline"
            onClick={openCamera}
            disabled={state() === "saving"}
          >
            {t.tryAgain}
            <Icon iconId="refresh" />
          </Button>
          <Button
            class="w-full data-[state='saving']:animate-pulse"
            variant="default"
            data-state={state()}
            disabled={state() === "saving"}
            onClick={async () => {
              setState("saving");
              try {
                await uploadImage(params.id, file()!);
                setState("saved");
                setFile();
              } catch (e) {
                console.error(e);
                setState("error");
              }
            }}
          >
            {t.savePicture}
          </Button>
        </div>
      </Show>
      <input
        ref={fileInputRef}
        class="hidden"
        type="file"
        accept="image/png, image/jpeg, image/webp, video/mp4, video/avc, video/H264, video/H264-SVC"
        capture="environment"
        onChange={async (e) => {
          const file = e.currentTarget?.files?.[0];
          if (file) {
            setFile(file);
            setState("draft");
          }
        }}
      />

      <Switch>
        <Match when={state() === "saved"}>
          <div class="bg-success text-success-foreground  rounded-lg shadow border py-2 px-4">
            <p class="text-center align-middle font-bold text-xl">{t.thanksForYourPicture}</p>
          </div>
        </Match>
        <Match when={state() === "error"}>
          <div class="bg-destructive text-destructive-foreground  rounded-lg shadow border py-2 px-4">
            <p class="text-center align-middle font-bold text-xl">{t.uploadError}</p>
          </div>
        </Match>
      </Switch>
    </div>
  );
};
