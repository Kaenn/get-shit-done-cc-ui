import * as ToggleGroup from "@radix-ui/react-toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Terminal, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGSDStore } from "@/stores/gsdStore";

const views = [
  { value: "commands" as const, icon: Terminal, label: "Commands" },
  { value: "state" as const, icon: FolderTree, label: "State" },
];

export function GSDIconSidebar() {
  const sidebarActiveView = useGSDStore((state) => state.sidebarActiveView);
  const setSidebarActiveView = useGSDStore(
    (state) => state.setSidebarActiveView
  );

  return (
    <TooltipProvider delayDuration={400}>
      <div className="w-12 h-full flex flex-col bg-background">
        <ToggleGroup.Root
          type="single"
          orientation="vertical"
          value={sidebarActiveView}
          onValueChange={(value) => {
            // Prevent deselection - only update if value exists
            if (value) {
              setSidebarActiveView(value as "commands" | "state");
            }
          }}
          className="flex flex-col"
        >
          {views.map(({ value, icon: Icon, label }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <ToggleGroup.Item
                  value={value}
                  aria-label={label}
                  className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-md",
                    "transition-colors",
                    "data-[state=on]:border-l-2 data-[state=on]:border-primary",
                    "data-[state=off]:opacity-60",
                    "hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </ToggleGroup.Item>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup.Root>
      </div>
    </TooltipProvider>
  );
}
