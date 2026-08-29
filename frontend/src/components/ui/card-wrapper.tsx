import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  
} from "./card";


interface CardWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
}

export function CardWrapper({
  title,
  description,
  footer,
  actions,
  children,
  ...props
}: CardWrapperProps) {
  return (
    <Card {...props}>
      {(title || actions) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
