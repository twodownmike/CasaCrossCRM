import { listEvents } from "@/lib/queries";
import { CalendarClient } from "./calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const events = await listEvents();
  return <CalendarClient events={events} />;
}
