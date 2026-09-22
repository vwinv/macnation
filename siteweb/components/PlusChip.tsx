import { Plus } from "@phosphor-icons/react/dist/ssr";

export default function PlusChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-x-2.5 rounded-3xl bg-gray-400/12 px-5 py-1.5 pr-1.5 font-medium text-black transition-all duration-300 hover:bg-gray-400/20">
      <span>{label}</span>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
        <Plus size={10} weight="fill" />
      </span>
    </span>
  );
}
