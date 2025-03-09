"use client";

import Camera from "@/components/Camera/Camera";
import { MetricsProvider } from "@/context/MetricsContext";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function Page() {
  return (
      <MetricsProvider>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <Camera />
          </ResizablePanel>
        </ResizablePanelGroup>
      </MetricsProvider>
  );
}