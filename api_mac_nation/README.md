# MAC NATION API

API NestJS unique pour le **site** (`mac-nation/`) et l’**app mobile** (`macnation/`).
Préfixe : `/api` · port par défaut : `3001`.

Le site Next.js n’a plus de backend : il reverse-proxie `/api/*` vers cette API.

## Démarrer

```bash
cd api_mac_nation
cp .env.example .env
# renseigner DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD, SITE_URL
npm install
npx prisma migrate dev
npm run start:dev
```

Santé : [http://localhost:3001/api/health](http://localhost:3001/api/health)

## Auth

- **App mobile** : `Authorization: Bearer <JWT>` (30 jours, téléphone + mot de passe, ou `POST /api/auth/oauth`).
- **Site** : cookies `mn_client` / `mn_admin` (même JWT), posés au login. Bearer reste accepté.

## Catalogue

`GET /api/catalog` (salon, services, produits, plans, articles, avis, offres).

Les IDs suivent le site (`combo`, `coupe-enfant`, `pommade`…).
Les anciens IDs app (`coupe-barbe`, `enfant`, `pommade-hold`…) sont acceptés.

## Compte & RDV (site + mobile)

| Méthode | Chemin | Auth |
|---|---|---|
| POST | `/api/auth/register` `/api/auth/login` | non |
| POST | `/api/auth/oauth` | non (Google / Apple / Facebook) |
| POST | `/api/auth/facebook` | non (token Graph ou JWT Limited Login) |
| POST | `/api/auth/facebook/data-deletion` | callback Meta |
| GET | `/api/auth/facebook/deletion/:code` | statut suppression |
| GET | `/api/auth/me` | Bearer |
| GET/PATCH | `/api/me` | Bearer |
| POST | `/api/me/redeem` | Bearer |
| DELETE | `/api/me/membership` | Bearer |
| GET | `/api/bookings/slots?date=` | non |
| POST | `/api/bookings` ou `/api/booking` | optionnel |
| GET | `/api/bookings` | Bearer |
| POST | `/api/checkout` | optionnel |
| POST | `/api/career` | non (multipart CV) |
| GET | `/api/invoices/:id` | non (page paiement) |

Alias site (cookies) : `/api/compte/login|register|logout|session|me|profile|redeem|membership|oauth`.

## Sign in with Apple

- `APPLE_CLIENT_ID` = Services ID web (`com.macnation.web`)
- `APPLE_BUNDLE_ID` = bundle iOS (`com.macnation.app`)
- Return URL Apple : `{SITE_URL}/compte/login`
- Fichier de domaine : `/.well-known/apple-developer-domain-association.txt` sur le site (`APPLE_DOMAIN_ASSOCIATION`)

## Admin

`POST /api/admin/login` avec `ADMIN_PASSWORD`, cookie `mn_admin`.

Puis salon, RDV, factures, paiements, caisse, clients, candidatures.

## PayTech

Clés `PAYTECH_API_KEY` + `PAYTECH_API_SECRET` (dashboard PayTech → Paramètres → API).
`PAYTECH_ENV=test` ou `prod` (prod seulement si le compte PayTech est activé).

- Demande : `POST /api/paytech/checkout` (alias `POST /api/paytech/softpay`)
- Statut facture : `GET /api/paytech/status?invoice=`
- IPN : `POST /api/paytech/ipn` — URL publique `{SITE_URL}/api/paytech/ipn` (HTTPS)

Sans clés, le reste de l’API continue (les routes paiement répondent 503).

SMS / email / WhatsApp : optionnels, jamais bloquants.

Persistance : **PostgreSQL** via Prisma (`DATABASE_URL`).
