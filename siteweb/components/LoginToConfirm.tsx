type ConfirmKind = "rdv" | "commande" | "abonnement";

type Props = {
  phone: string;
  kind: ConfirmKind;
  accountCreated?: boolean;
};

const WHAT: Record<ConfirmKind, string> = {
  rdv: "ton rendez-vous",
  commande: "ta commande",
  abonnement: "ton abonnement",
};

export function loginConfirmHref(phone: string, kind: ConfirmKind) {
  const params = new URLSearchParams({ next: "/compte", from: kind });
  if (phone) params.set("phone", phone);
  return `/compte/login?${params.toString()}`;
}

export default function LoginToConfirm({ phone, kind, accountCreated }: Props) {
  const what = WHAT[kind];
  return (
    <div className="w-full rounded-xl bg-[#e0b12c]/15 px-4 py-4 ring-1 ring-[#e0b12c]/40">
      <p className="text-sm text-black">
        {accountCreated
          ? `Ton compte client est créé. Le mot de passe arrive par SMS et email. Connecte-toi pour confirmer ${what}.`
          : `Connecte-toi pour confirmer ${what}. Tes infos sont déjà rattachées à ton compte.`}
      </p>
      <a
        href={loginConfirmHref(phone, kind)}
        className="btn-gold mt-4 flex h-12 w-full items-center justify-center rounded-lg text-sm font-medium"
      >
        Se connecter pour confirmer
      </a>
    </div>
  );
}
