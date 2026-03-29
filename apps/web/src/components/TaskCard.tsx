import type { ReactNode } from "react";

interface TaskCardProps {
  title: string;
  eyebrow: string;
  meta: string;
  detail: string;
  footer?: ReactNode;
}

export function TaskCard({
  title,
  eyebrow,
  meta,
  detail,
  footer
}: TaskCardProps) {
  return (
    <article>
      <p>{eyebrow}</p>
      <h3>{title}</h3>
      <p>{meta}</p>
      <p>{detail}</p>
      {footer ? <div>{footer}</div> : null}
    </article>
  );
}
