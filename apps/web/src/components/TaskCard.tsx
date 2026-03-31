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
    <article className="task-card task-card--feed">
      <p className="task-eyebrow">{eyebrow}</p>
      <h3 className="task-title">{title}</h3>
      <p className="task-meta">{meta}</p>
      <p className="task-detail">{detail}</p>
      {footer ? <div className="task-footer">{footer}</div> : null}
    </article>
  );
}
