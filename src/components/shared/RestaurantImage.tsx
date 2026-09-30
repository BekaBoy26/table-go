import React from "react";
import Image, { ImageProps } from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "src"> & { src: string | null | undefined };

/** next/image with a neutral placeholder for restaurants without a photo. */
const RestaurantImage = ({ src, alt, className, fill, width, height, ...props }: Props) => {
  if (src) return <Image src={src} alt={alt} fill={fill} width={width} height={height} className={className} {...props} />;

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("grid place-items-center bg-muted text-muted-foreground", fill && "absolute inset-0", className)}
      style={fill ? undefined : { width: Number(width), height: Number(height) }}
    >
      <UtensilsCrossed size={20} />
    </div>
  );
};

export default RestaurantImage;
