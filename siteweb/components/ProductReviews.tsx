"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "@phosphor-icons/react";

function ReviewStars({ value }: { value: number }) {
  const rating = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={16} weight={n <= rating ? "fill" : "regular"} className={n <= rating ? "text-[#e0b12c]" : "text-black/20"} />
      ))}
    </span>
  );
}

export type ProductReview = {
  id: string;
  createdAt: string;
  rating: number | null;
  comment: string;
  name: string;
};

type Props = {
  productId?: string;
  serviceId?: string;
  initialReviews: ProductReview[];
  initialAverage: number;
  initialCount: number;
  initialMyRating?: number | null;
};

export default function ProductReviews({
  productId,
  serviceId,
  initialReviews,
  initialAverage,
  initialCount,
  initialMyRating = null,
}: Props) {
  const endpoint = productId
    ? `/api/catalog/products/${productId}/reviews`
    : `/api/catalog/services/${serviceId}/reviews`;
  const loginNext = productId ? `/boutique/${productId}` : `/services/${serviceId}`;
  const subject = productId ? "ce produit" : "cette prestation";
  const [loggedIn, setLoggedIn] = useState(false);
  const [reviews, setReviews] = useState(initialReviews);
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [myRating, setMyRating] = useState<number | null>(initialMyRating);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(initialMyRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/compte/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { name?: string; id?: string }) => {
        setLoggedIn(Boolean(json.name || json.id));
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextRating = myRating ? null : rating || null;
    if (!loggedIn || (!nextRating && !comment.trim())) return;
    setError("");
    setSending(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: nextRating, comment }),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: string;
        reviews?: ProductReview[];
        average?: number;
        count?: number;
        myRating?: number | null;
      } | null;
      if (!res.ok) {
        setError(json?.error || "Avis non enregistré.");
        return;
      }
      setReviews(Array.isArray(json?.reviews) ? json.reviews : reviews);
      setAverage(typeof json?.average === "number" ? json.average : average);
      setCount(typeof json?.count === "number" ? json.count : count);
      if (typeof json?.myRating === "number") {
        setMyRating(json.myRating);
        setRating(json.myRating);
      }
      setComment("");
      setHoverRating(0);
    } catch {
      setError("Connexion interrompue. Réessayez.");
    } finally {
      setSending(false);
    }
  }

  const fieldClass = loggedIn
    ? "rounded-lg bg-white text-black ring-1 ring-black/10 focus:ring-[#e0b12c]/50"
    : "cursor-not-allowed rounded-lg bg-gray-100 text-gray-300 ring-1 ring-black/5";

  return (
    <section className="mt-16 border-t border-black/10 pt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold text-black">Avis et notes Clients</h2>
        {count > 0 ? (
          <p className="text-sm text-gray-500">
            {average.toString().replace(".", ",")} / 5 · {count} avis
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-8">
        <div className="flex flex-col gap-2 text-sm font-medium text-black">
          <span>Note</span>
          <div
            className="inline-flex items-center gap-1"
            onMouseLeave={() => setHoverRating(0)}
            role="radiogroup"
            aria-label="Note"
          >
            {[1, 2, 3, 4, 5].map((n) => {
              const shown = myRating || hoverRating || rating;
              const active = n <= shown;
              const locked = Boolean(myRating);
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={shown === n}
                  aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                  disabled={!loggedIn || locked}
                  onMouseEnter={() => loggedIn && !locked && setHoverRating(n)}
                  onClick={() => setRating((current) => (current === n ? 0 : n))}
                  className={loggedIn && !locked ? "cursor-pointer" : "cursor-not-allowed"}
                >
                  <Star
                    size={28}
                    weight={active && loggedIn ? "fill" : "regular"}
                    className={
                      active && loggedIn ? "text-[#e0b12c]" : loggedIn ? "text-black/25" : "text-gray-300"
                    }
                  />
                </button>
              );
            })}
          </div>
          {myRating ? <p className="text-xs font-normal text-gray-500">Tu as déjà laissé une note. Tu peux encore commenter.</p> : null}
        </div>

        <label className="mt-6 flex flex-col gap-2 text-sm font-medium text-black">
          Commentaire
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!loggedIn}
            rows={4}
            maxLength={800}
            placeholder={loggedIn ? `Partage ton avis sur ${subject}.` : "Connecte-toi pour laisser un commentaire."}
            className={`min-h-28 w-full resize-y px-4 py-3 text-sm outline-none ${fieldClass}`}
          />
        </label>

        {!loggedIn ? (
          <p className="mt-4 text-sm text-gray-400">
            <Link href={`/compte/login?next=${loginNext}`} className="font-medium text-black underline">
              Connecte-toi
            </Link>{" "}
            pour laisser un avis et une note.
          </p>
        ) : null}

        {error ? <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={!loggedIn || sending || (!myRating && rating < 1 && !comment.trim()) || (Boolean(myRating) && !comment.trim())}
          className={`mt-6 inline-flex h-11 items-center justify-center rounded-lg px-8 text-sm font-medium ${
            loggedIn ? "btn-gold cursor-pointer disabled:opacity-70" : "cursor-not-allowed bg-gray-100 text-gray-300"
          }`}
        >
          {sending ? "Envoi…" : "Publier l’avis"}
        </button>
      </form>

      <div className="mt-12">
        <h3 className="text-lg font-bold text-black">Liste des avis Clients</h3>
        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">Aucun avis pour le moment.</p>
        ) : (
          <ul className="mt-5 divide-y divide-black/[0.06]">
            {reviews.map((item) => (
              <li key={item.id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-medium text-black">{item.name}</p>
                  {item.rating ? <ReviewStars value={item.rating} /> : null}
                </div>
                {item.comment ? <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.comment}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
