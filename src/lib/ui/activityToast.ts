import { toast } from "@/components/snakbar";

type ActivityStep = {
  type: string;
  status?: "started" | "completed" | "failed";
  label?: string;
  error?: string;
};

export function showActivityStep(event: ActivityStep, id: string) {
  if (event.type !== "step" || !event.label) return;
  if (event.status === "failed") {
    toast.error(event.error ? `${event.label}: ${event.error}` : event.label, { id });
  } else {
    const message = event.status === "completed" ? `${event.label} complete` : event.label;
    toast.loading(message, { id });
  }
}

export function finishActivity(id: string, success: boolean, message: string) {
  if (success) toast.success(message, { id });
  else toast.error(message, { id });
}
