# CIS Chessy - Solution Opérationnelle Mobile

## Description du projet
Cette application mobile a été conçue pour répondre aux problématiques de réactivité et d'organisation interne du Centre d'Incendie et de Secours (CIS) de Chessy. Elle centralise :
- La gestion des gardes (créneaux de 12h) avec affichage groupé par date.
- Le suivi de la formation (Livret de progression numérique).
- La diffusion d'alertes critiques avec redondance par email.
- L'accès rapide aux documents de formation.

## Choix Techniques (Open Source & Cloud)
Conformément aux contraintes de budget nul et d'efficacité, nous avons intégré des briques technologiques Open Source majeures :

- **Framework :** React Native (Expo) - Choix du multiplateforme (iOS/Android).
- **Backend & Database :** Firebase Firestore - Utilisation du "Spark Plan" (Gratuit).
- **Icônes :** Lucide-React-Native - Bibliothèque Open Source.
- **Composants tiers :** React-Native-Calendars - Pour la gestion des dates.
- **Communications :** EmailJS - API gratuite pour l'envoi de mails de secours.

## Installation & configuration

```bash
npm install
cp .env.example .env   # puis renseignez vos identifiants Firebase / EmailJS dans .env
npx expo start
```

`.env` contient les identifiants Firebase et EmailJS et n'est **jamais** commité (voir
`.gitignore`) — seul `.env.example` (sans valeurs réelles) est versionné. L'app refuse de
démarrer si `.env` est absent ou incomplet.

## Structure du code
```
App.js                      Écran racine : navigation, état de session, connexion/inscription
src/
  firebase.js                Initialisation Firebase (app, Firestore, Auth anonyme)
  theme.js                   Palette de couleurs (clair/sombre) et styles partagés
  constants.js                Référentiel de formation et niveaux d'alerte
  hooks/useAppData.js         Abonnements Firestore temps réel + gestion des erreurs réseau
  utils/errors.js             Traduction des erreurs Firebase + wrapper d'action sécurisée
  utils/training.js           Calcul de la progression de formation
  utils/emailjs.js            Envoi d'email de secours via EmailJS
  components/                 TopNav, BottomNav
  screens/                    Login, Dashboard, Alerts, Documents, Training, Admin
```

## ⚠️ Mise en service après cette mise à jour : étape obligatoire

Cette mise à jour ajoute une authentification Firebase anonyme obligatoire pour accéder à
Firestore (voir "Sécurité" ci-dessous). **Sans l'étape suivante, plus personne ne pourra se
connecter à l'app** (écran "Impossible de se connecter au serveur") :

1. Ouvrir la [Console Firebase](https://console.firebase.google.com/project/cis-chessy-app/authentication/providers).
2. Authentication → Sign-in method → activer le fournisseur **Anonyme**.
3. Déployer les nouvelles règles Firestore (voir ci-dessous).

## Déploiement des règles de sécurité Firestore

Les règles sont définies dans [`firestore.rules`](firestore.rules). Pour les publier :

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project cis-chessy-app
```

## Développement local avec les émulateurs Firebase (optionnel)

Pour tester sans toucher aux données réelles des pompiers :

```bash
npx firebase-tools emulators:start --project cis-chessy-app
# Dans un autre terminal :
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=1 npx expo start --web
```

Nécessite un JDK 21+ pour l'émulateur Firestore.

## Build EAS

Les builds cloud (`eas build`) n'ont pas accès à votre `.env` local : déclarez les mêmes
variables comme secrets EAS avant de builder, par exemple :

```bash
eas env:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..." --visibility sensitive
# répéter pour chaque variable de .env.example
```

## Sécurité & Roadmap V2

**Ce qui a été corrigé dans cette mise à jour :**
- L'app impose désormais une authentification Firebase (anonyme) avant tout accès à Firestore.
  Auparavant, la base était accessible à quiconque connaissait la configuration Firebase
  publique (visible dans le code de l'app), sans aucune protection — et si les règles
  Firestore passaient hors "mode test" (ce qui expire automatiquement 30 jours après la
  création du projet), l'app entière cessait de fonctionner silencieusement pour tous les
  utilisateurs déjà créés.
- Les nouvelles inscriptions ne peuvent plus s'auto-valider ni s'auto-attribuer le rôle admin
  (contrôlé côté règles Firestore, pas seulement côté app).
- Toutes les écritures (créer une alerte, valider un compte, etc.) affichent un message d'erreur
  clair en cas d'échec au lieu d'échouer silencieusement.

**Limite connue, à traiter en V2 :**
La connexion compare toujours l'identifiant/mot de passe en clair stockés dans le document
Firestore de l'utilisateur (pas de hachage). C'était déjà le fonctionnement d'origine — le
changer casserait la connexion de tous les comptes déjà créés sans une migration dédiée. Les
règles Firestore ajoutées limitent l'accès aux clients authentifiés (anonymement), mais ne
peuvent pas distinguer un compte admin d'un compte standard côté serveur : un client
techniquement compromis pourrait toujours lire/modifier les documents `users`.

**Roadmap prévue :**
- Migrer vers Firebase Authentication (email/mot de passe + custom claims pour le rôle), avec
  une migration en douceur des comptes existants (ex. création du compte Auth au premier login
  réussi avec l'ancien système).
- Passer les actions sensibles (valider un compte, changer un rôle) par des Cloud Functions
  plutôt que des écritures Firestore directes depuis le client.
