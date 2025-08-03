import { createTimer } from "@solid-primitives/timer";
import { createAsync, useParams, useSearchParams } from "@solidjs/router";
import QRCode from "qrcode";
import { createResource, createSignal } from "solid-js";
import { Kimatik } from "~/components/Kimatik";
import Slideshow from "~/components/ui/slideshow";
import { getEvent } from "~/server/getEvent";
import { t } from "~/t";

export default () => {
  const params = useParams();
  const [search] = useSearchParams();
  const duration = () => Number.parseInt((search.duration as string) ?? "");
  const [event, { refetch }] = createResource(
    async () => await getEvent(params.id, { images: true }),
  );

  createTimer(refetch, 10000, setInterval);

  const uploadPageUrl = () => `${window.location.origin}/event/${params.id}`;

  const [uploadQrCode] = createResource(async () => {
    return await QRCode.toDataURL(uploadPageUrl(), { width: 256 });
  });

  const [index, setIndex] = createSignal(0);

  return (
    <div class="relative size-full flex-1 bg-black">

      <Slideshow
        value={index()}
        onValueChange={setIndex}
        class="size-full flex-1 bg-black"
        srcs={event.latest?.images.map((x) => `/image/${x.id}`) ?? []}
        duration={Number.isFinite(duration()) ? duration() : 8000}
      />
      <div class="absolute top-4 left-4 flex items-end gap-4">
        <span class="text-shadow-black text-white text-shadow-sm text-4xl font-bold">{event.latest?.title}</span>
      </div>
      <div class="absolute top-4 right-4 flex items-end gap-4">
        <Kimatik class="w-24" />
      </div>
      <div class="absolute bottom-4 left-4 flex items-end gap-4">
        <span class="text-shadow-black text-white text-shadow-sm text-4xl font-bold">{(index() + 1).toFixed()}/{event.latest?.images.length?.toFixed() ?? "..."}</span>
      </div>
      <div class="absolute bottom-4 right-4 flex flex-col items-end gap-4">
        <span class="text-shadow-black text-white text-shadow-sm text-5xl font-bold">{t.uploadHere}</span>
        <img src={uploadQrCode.latest} alt="uploadLink" class="" />
        <a href={uploadPageUrl()} target="_blank" class="rounded-full px-2 bg-black/50 text-white text-shadow-sm font-medium text-lg">{uploadPageUrl()}</a>
      </div>
    </div>
  );
};
