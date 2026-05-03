import Image from "next/image";

type Variant = "header" | "sidebar" | "auth" | "compact";

const SIZES: Record<Variant, { w: number; h: number }> = {
  header: { w: 132, h: 56 },
  sidebar: { w: 168, h: 72 },
  auth: { w: 220, h: 94 },
  compact: { w: 96, h: 41 },
};

export function Logo({
  variant = "header",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const { w, h } = SIZES[variant];
  return (
    <Image
      src="/logo.png"
      alt="Casa Cross"
      width={808}
      height={346}
      priority
      style={{
        height: h,
        width: "auto",
        maxWidth: w,
        display: "block",
        mixBlendMode: "multiply",
      }}
      className={className}
    />
  );
}
