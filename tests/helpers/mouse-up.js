import { triggerEvent } from "@ember/test-helpers";

export default async function(selector) {
  await triggerEvent(selector, "mouseup");
}
