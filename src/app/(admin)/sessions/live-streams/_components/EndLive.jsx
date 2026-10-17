import { Power } from "lucide-react";
import { ActionButton } from "@/components/common/ActionButton";
import { endLiveStream } from "@/actions/sessions";

const END_REASONS = ["Inappropriate content", "Asked viewers to pay outside the app", "Abuse reported", "Technical issue · stuck stream", "Requested by the astrologer"];

/** Ends an astrologer's live stream now. Hidden without sessions.edit; the backend enforces the same check. */
export function EndLive({ room, size = "xs" }) {
  return (
    <ActionButton
      module="sessions"
      reason
      reasons={END_REASONS}
      variant="danger-soft"
      size={size}
      icon={<Power />}
      dialogTitle="End live stream"
      dialogDescription={`${room.astrologer.name} · "${room.title || "Live"}". The stream stops now for everyone watching.`}
      confirmLabel="End live"
      success="Live stream ended"
      run={endLiveStream.bind(null, room.id)}
    >
      End live
    </ActionButton>
  );
}
