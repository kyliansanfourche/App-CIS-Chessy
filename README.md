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

##Déploiement & Réalisme
Le projet est conçu pour être déployable sans aucun coût pour le SDIS via GitHub et Firebase.

## Sécurité & Roadmap V2
Actuellement en version Prototype (MVP), la sécurité repose sur un SAS de validation par l'administrateur.
**Roadmap prévue :**
- Migration vers Firebase Authentication.
- Implémentation des Firestore Security Rules.
