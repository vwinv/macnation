"use client";

import { useState } from "react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ApplyForm from "@/components/ApplyForm";
import { jobs } from "@/lib/data";
import { pageImages } from "@/lib/assets";

const tracks = ["Barber", "Accueil"] as const;

export default function CareerPage() {
  const [track, setTrack] = useState<(typeof tracks)[number]>("Barber");
  const [applyId, setApplyId] = useState("");
  const list = jobs.filter((j) => j.track === track);

  return (
    <main>
      <PageHero
        title="Écrivez l'histoire avec nous"
        subtitle="Rejoignez MAC NATION à Nord Foire. Un salon, une équipe, un standard."
        image={pageImages.career}
      />
      <section className="mx-auto max-w-[1000px] px-6 pb-24">
        <div className="mb-10 flex justify-center gap-2">
          {tracks.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTrack(t);
                setApplyId("");
              }}
              className={`cursor-pointer rounded-lg px-6 py-2 text-sm ${
                track === t ? "bg-white text-gray-950" : "bg-gray-900 text-gray-600 hover:bg-gray-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5">
          {list.map((job, i) => (
            <Reveal key={job.id} delay={i * 0.05}>
              <article className="rounded-2xl bg-black p-7">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="font-bebas text-3xl text-white">{job.title}</h2>
                  <span className="text-xs text-white/50">
                    {job.type} · {job.location}
                  </span>
                </div>
                <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-white/60">{job.blurb}</p>
                {applyId === job.id ? (
                  <ApplyForm job={job} onDone={() => setApplyId("")} />
                ) : (
                  <button
                    type="button"
                    onClick={() => setApplyId(job.id)}
                    className="btn-gold mt-6 inline-flex h-10 cursor-pointer items-center rounded-lg px-5 text-sm"
                  >
                    Postuler
                  </button>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
