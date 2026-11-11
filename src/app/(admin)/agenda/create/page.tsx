// app/(admin)/agenda/create/page.tsx — agenda items are created in the slide-over on /agenda.
import { redirect } from "next/navigation";

export default function CreateAgendaPage() {
  redirect("/agenda?new=1");
}
