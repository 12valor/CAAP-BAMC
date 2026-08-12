import Image from "next/image";
import { cn } from "@/lib/utils";

type CaapLogoProps = {
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function CaapLogo({ className, priority = false, sizes = "96px" }: CaapLogoProps) {
  return (
    <Image
      src="/brand/caap-logo.webp"
      alt="Civil Aviation Authority of the Philippines"
      width={960}
      height={703}
      sizes={sizes}
      priority={priority}
      className={cn("h-auto w-full object-contain", className)}
    />
  );
}
