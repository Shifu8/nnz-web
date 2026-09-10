"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OrganizerProfileOverlay from "@/frontend/features/organizer/OrganizerProfileOverlay";
import { events as fallbackEvents, getEvents } from "@/frontend/services/nenezData";
import type { Event } from "@/frontend/types/domain";

export default function OrganizerSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [allEvents, setAllEvents] = useState<Event[]>(getEvents() || fallbackEvents);

  useEffect(() => {
    fetch("/api/master")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.events) && data.events.length > 0) {
          setAllEvents(data.events);
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    router.push("/");
  };

  return (
    <OrganizerProfileOverlay
      isOpen={isOpen}
      onClose={handleClose}
      organizerName={slug}
      allEvents={allEvents}
      onSelectEvent={(evt) => {
        router.push(`/?event=${(evt as any).slug || evt.id}`);
      }}
      onBuyEvent={(evt) => {
        router.push(`/?event=${(evt as any).slug || evt.id}&reserve=1`);
      }}
    />
  );
}
