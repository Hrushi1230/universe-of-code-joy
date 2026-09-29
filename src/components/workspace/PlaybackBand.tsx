import * as React from "react";
import { ControlStrip } from "@/components/player/ControlStrip";
import { StepTimeline } from "@/components/player/StepTimeline";
import { cn } from "@/lib/utils";

export interface PlaybackBandProps {
  className?: string;
}

/**
 * The full-width band under both workspace columns: one compact row with the
 * transport controls wrapped around the phase timeline.
 */
export function PlaybackBand({ className }: PlaybackBandProps): React.ReactElement {
  return (
    <section
      aria-label="Playback"
      className={cn(
        "flex shrink-0 items-center overflow-hidden rounded-2xl border border-hairline bg-card px-3 py-2.5 shadow-sm sm:px-5 lg:h-[58px] lg:min-h-[58px]",
        className,
      )}
    >
      <ControlStrip>
        <StepTimeline />
      </ControlStrip>
    </section>
  );
}

export default PlaybackBand;
