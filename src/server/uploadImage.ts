import { action, revalidate } from "@solidjs/router";
import { getEvent } from "./getEvent";

export const uploadImage = async (eventId: string, file: File) => {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`/api/upload/${eventId}`, {
    method: "POST",
    body: form,
  });

  revalidate(getEvent.keyFor(eventId));

  return await res.json();
};
