import React from "react";

const Tags = ({ tags }: { tags: string[] }) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          {tag}
        </span>
      ))}
    </div>
  );
};

export default Tags;
