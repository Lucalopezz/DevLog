import { useState } from "react";
import {
  BriefcaseBusiness,
  CircleHelp,
  ExternalLink,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

/** Keeps help contact links and dialog state out of the sidebar layout component. */
export function HelpFeedbackDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setIsOpen(true)}
          title="Help & feedback"
          type="button"
        >
          <CircleHelp />
          <span>Help & feedback</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogContent className="gap-6 border-border/60 bg-card p-7 shadow-2xl ring-0 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Help & feedback
            </DialogTitle>
            <DialogDescription className="leading-6">
              Need help or have feedback? Reach out or learn more about my work.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              asChild
              className="h-auto w-full justify-between whitespace-normal px-4 py-3 text-left"
              variant="outline"
            >
              <a
                href="https://www.linkedin.com/in/lucas-dalossa-a24381356/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="flex items-center gap-3">
                  <MessageCircle aria-hidden="true" className="size-5" />
                  <span className="space-y-1">
                    <span className="block font-medium">Connect on LinkedIn</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      Contact me for help, questions, or feedback.
                    </span>
                  </span>
                </span>
                <ExternalLink
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
              </a>
            </Button>

            <Button
              asChild
              className="h-auto w-full justify-between whitespace-normal px-4 py-3 text-left"
              variant="outline"
            >
              <a
                href="https://lucasdolopes.vercel.app/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="flex items-center gap-3">
                  <BriefcaseBusiness aria-hidden="true" className="size-5" />
                  <span className="space-y-1">
                    <span className="block font-medium">Visit my portfolio</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      Explore my projects and professional experience.
                    </span>
                  </span>
                </span>
                <ExternalLink
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
