# MAC NATION — ce qu’il reste à faire

Fichier de suivi, **hors des trois dépôts**. Coche au fur et à mesure.

Projets :

- **API** — `api_mac_nation/` (Nest + Postgres)
- **Site** — `mac-nation/` (Next.js, frontend seulement)
- **App** — `macnation/` (Flutter)

Ce fichier liste **uniquement ce que toi tu dois fournir ou configurer**. Le code (contact, créneaux, crédit admin, téléphone OAuth sur le site) est déjà en place.

---

## 1. Hébergement

- [ ] Déployer l’API (Railway, Fly, Render…) avec Postgres
- [ ] Variables API : `DATABASE_URL`, `JWT_SECRET` (fort), `ADMIN_PASSWORD`, `SITE_URL` (= origine réelle du site, ex. `https://mac-nation.vercel.app`)
- [ ] `npx prisma migrate deploy` en production
- [ ] Vérifier `GET /api/health`
- [ ] Sur **Vercel** : `API_URL` (+ `NEXT_PUBLIC_API_URL`) = URL **publique** de Nest (sans ça le site ne parle pas à l’API)
- [ ] `NEXT_PUBLIC_SITE_URL` = domaine du site
- [ ] Retirer Redis / Gist / Twilio du dashboard Vercel s’ils y sont encore (tout passe par l’API)

---

## 2. Numéro du salon

- [ ] Remplacer le placeholder `+221 77 000 00 00` dans `api_mac_nation/src/catalog/catalog.data.ts` (`SALON.phone`) par le **vrai** numéro, puis redéployer l’API

---

## 3. Mails / SMS (pour recevoir les messages)

Sans ces clés, les RDV, candidatures et le **formulaire Contact** s’enregistrent ou répondent OK, mais le salon **ne reçoit rien** par mail/SMS.

- [ ] Resend : `RESEND_API_KEY` + `EMAIL_FROM` + `BOOKING_EMAIL_TO` (boîte du salon)
- [ ] Twilio SMS / WhatsApp (optionnel) : `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, numéros From

---

## 4. PayTech (Wave / Orange / Free)

Compte PayTech : [paytech.sn](https://paytech.sn) → Dashboard → Paramètres → API.

- [ ] `PAYTECH_API_KEY` + `PAYTECH_API_SECRET` dans le `.env` de l’API
- [ ] `PAYTECH_ENV=test` tant que le compte n’est pas activé (en test, PayTech débite **100–150 F** au hasard)
- [ ] Pour le live : email `contact@paytech.sn` objet « Activation Compte PayTech » + pièces (NINEA, RCCM, etc.) puis `PAYTECH_ENV=prod`
- [ ] `SITE_URL` en **HTTPS** (l’IPN `ipn_url` n’accepte que HTTPS) : `{SITE_URL}/api/paytech/ipn`
- [ ] Un paiement test de bout en bout (site + app)
- [ ] Sans clés : facture créée, checkout en 503, encaissement espèces / Wave / Orange / Free **au salon** possible dans `/admin`

---

## 5. Facebook (Meta)

Backend déjà prêt. À faire dans [Meta Developers](https://developers.facebook.com/) :

- [ ] Créer l’app Facebook
- [ ] `FACEBOOK_APP_ID` + `FACEBOOK_APP_SECRET` dans le `.env` de l’API
- [ ] Login, domaines, URI de redirection = origine du site
- [ ] **Suppression des données** (callback Meta) : `{SITE_URL}/api/auth/facebook/data-deletion`
- [ ] Politique de confidentialité : `https://…/privacy` (déjà sur le site)
- [ ] Page de confirmation utilisateur : `https://…/suppression-donnees`

Sans ces IDs, le bouton Facebook répond « pas encore activée ».

---

## 6. Google / Apple

- [ ] `GOOGLE_CLIENT_ID` (client Web — même ID pour le site et `serverClientId` de l’app)
- [ ] SHA-1 Android dans Google Cloud + `GIDClientID` / URL scheme iOS
- [ ] `APPLE_CLIENT_ID` (Services ID) + domaine / return URL Apple
- [ ] Capability **Sign in with Apple** sur le bundle iOS (ne marche pas sur Android)

---

## 7. App Flutter

- [ ] Build de prod avec `--dart-define=API_URL=https://ton-api.example.com` (plus de localhost / `10.0.2.2`)
- [ ] Facebook **SDK mobile** (`flutter_facebook_auth` ou Limited Login iOS) : aujourd’hui le bouton dit d’utiliser le site
- [ ] iOS Facebook : URL scheme `fb{APP_ID}`, `FacebookAppID`, `FacebookClientToken`
- [ ] Android Facebook : `strings.xml` + hash de clé dans Meta
- [ ] Stores : icônes, splash, nom « MAC NATION », comptes Apple Developer / Play Console
- [ ] Privacy labels / permissions (réseau, éventuellement tracking Facebook)
- [ ] Paiement : package `paytech` déjà branché ; tester Wave / Orange / Free avec `PAYTECH_ENV=test`

Hors sujet volontairement : carrière / CV et backoffice ne vont pas dans l’app.

---

## 8. Candidatures (CV)

- [ ] Volume persistant ou S3 pour les fichiers `uploads/` : aujourd’hui le disque de la machine API. Un redéploiement **efface** les CV s’il n’y a pas de volume.

---

## 9. Catalogue

- [ ] Prix / prestations encore **en code** (`catalog.data.ts`). Changer un tarif = modifier le fichier + redéployer l’API (et le site s’il a une copie locale du catalogue).

---

## 10. Backoffice

- [ ] Mot de passe = `ADMIN_PASSWORD` de l’API
- [ ] Parcourir une fois en prod : agenda, factures, paiements, caisse, compta, clients (points **et** crédit ±1 000 F), candidatures

---

## Ordre conseillé

1. Déployer l’API + `API_URL` sur Vercel  
2. Vrai numéro du salon + `ADMIN_PASSWORD`  
3. Resend (sinon tu ne vois pas les messages Contact / RDV)  
4. PayTech + un paiement test (`PAYTECH_ENV=test`)  
5. Meta / Google / Apple  
6. `API_URL` de prod dans l’app + Facebook SDK mobile  
7. Volume persistant (ou S3) pour les CV  

---

*Dernière mise à jour : 18 septembre 2026.*
