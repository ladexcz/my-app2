"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BADGE, BUTTON, IMAGE, TEXT } from "@/lib/tailwind";

type ProductCardProps = {
  title: string;
  owner?: string;
  subtitle: string;
  metadata: string;
  price: string;
  badge?: string;
  image?: string;
  actionLabel: string;
  onAction: () => void;
};

export default function ProductCard({
  title,
  owner,
  subtitle,
  metadata,
  price,
  badge,
  image,
  actionLabel,
  onAction,
}: ProductCardProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fallbackImage = "/placeholder.png";
  const imageSrc = image && !hasError ? image : fallbackImage;

  useEffect(() => {
    console.log("ProductCard image:", image);
    setHasError(false);
    setIsLoading(true);
  }, [image]);

  const badgeClass = badge
    ? /NEW|HOT/i.test(badge)
      ? BADGE.gold
      : BADGE.green
    : "";

  return (
    <article className="rounded-3xl border border-[#D8D3BC] bg-[#F8F4E2] p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className={IMAGE.container}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#E8F5E9] text-sm text-[#4F4F4F]">
            Loading image...
          </div>
        ) : null}
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover"
          onError={() => {
            if (imageSrc !== fallbackImage) {
              setHasError(true);
            } else {
              setIsLoading(false);
            }
          }}
          onLoadingComplete={() => setIsLoading(false)}
          unoptimized
        />
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className={TEXT.heading}>{title}</h3>
          {owner ? <p className="mt-1 text-sm text-[#4F4F4F]">By {owner}</p> : null}
          <p className="mt-1 text-sm text-[#4F4F4F]">{subtitle}</p>
        </div>
        {badge ? <span className={badgeClass}>{badge}</span> : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-[#4F4F4F]">
        <p>{metadata}</p>
        <p className="text-base font-semibold text-[#1B1B1B]">{price}</p>
      </div>

      <button
        type="button"
        onClick={onAction}
        className={`mt-5 w-full ${BUTTON.primary}`}
      >
        {actionLabel}
      </button>
    </article>
  );
}

