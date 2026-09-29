import * as React from "react";
import { DESIGN_HEIGHT, DESIGN_WIDTH, scaledHeight } from "@/lib/fitScale";
import { useFitScale } from "@/hooks/useFitScale";
import { cn } from "@/lib/utils";

/**
 * Renders a fixed-width desktop layout as a faithful miniature on narrower
 * screens: same DOM, same proportions, uniformly scaled. At full width the
 * children render with no transform at all, so the desktop path is untouched.
 */
export function DesktopScaleFrame({
  children,
  className,
  designWidth = DESIGN_WIDTH,
  designHeight = DESIGN_HEIGHT,
  scaleNarrow = true,
}: {
  children: React.ReactNode;
  className?: string;
  designWidth?: number;
  designHeight?: number;
  /** False for screens that provide a real responsive reflow. */
  scaleNarrow?: boolean;
}): React.ReactElement {
  const { ref, scale } = useFitScale(designWidth);
  const isScaled = scaleNarrow && scale < 1;

  return (
    <div
      ref={ref}
      className={cn(
        "w-full",
        isScaled ? "flex h-full flex-col justify-center overflow-hidden" : "h-full",
        className,
      )}
    >
      {isScaled ? (
        <div className="shrink-0" style={{ height: scaledHeight(scale, designHeight) }}>
          <div
            style={{
              width: designWidth,
              height: designHeight,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default DesktopScaleFrame;
