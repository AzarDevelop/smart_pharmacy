import React, { useCallback } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { ArrowDownIcon } from "lucide-react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

export interface ConversationProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const Conversation = ({ className = "", children, ...props }: ConversationProps) => {
  const StickComp = StickToBottom as any;
  return (
    <StickComp
      className={cn("relative flex-1 overflow-y-hidden", className)}
      initial="smooth"
      resize="smooth"
      role="log"
      {...props}
    >
      {children}
    </StickComp>
  );
};

export interface ConversationContentProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const ConversationContent = ({
  className = "",
  children,
  ...props
}: ConversationContentProps) => {
  const ContentComp = StickToBottom.Content as any;
  return (
    <ContentComp
      className={cn("flex flex-col gap-4 p-4", className)}
      {...props}
    >
      {children}
    </ContentComp>
  );
};

export interface ConversationEmptyStateProps {
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  [key: string]: any;
}

export const ConversationEmptyState = ({
  className = "",
  title = "No messages yet",
  description = "Start a conversation to see messages here",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => (
  <div
    className={cn(
      "flex size-full flex-col items-center justify-center gap-3 p-8 text-center",
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        {icon && <div className="text-slate-400">{icon}</div>}
        <div className="space-y-1">
          <h3 className="font-medium text-sm text-slate-800">{title}</h3>
          {description && (
            <p className="text-slate-500 text-xs">{description}</p>
          )}
        </div>
      </>
    )}
  </div>
);

export interface ConversationScrollButtonProps {
  className?: string;
  [key: string]: any;
}

export const ConversationScrollButton = ({
  className = "",
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  if (isAtBottom) return null;

  return (
    <Button
      className={cn(
        "absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full shadow-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 z-10",
        className
      )}
      onClick={handleScrollToBottom}
      size="icon"
      type="button"
      variant="outline"
      {...props}
    >
      <ArrowDownIcon className="w-4 h-4" />
    </Button>
  );
};
