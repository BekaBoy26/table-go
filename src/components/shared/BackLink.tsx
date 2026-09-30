import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  href: string;
  label?: string;
};

const BackLink = ({ href, label = "Back" }: Props) => {
  return (
    <Link
      href={href}
      className="mb-6 flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
};

export default BackLink;
