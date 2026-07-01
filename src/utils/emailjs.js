// Comme la config Firebase, ces identifiants EmailJS sont conçus pour être utilisés côté
// client (clé publique) : ils viennent des variables d'environnement pour éviter de les figer
// en dur dans l'historique Git, pas parce qu'ils seraient secrets. Pensez à activer la
// restriction de domaine / reCAPTCHA dans le tableau de bord EmailJS pour éviter les abus.
const EMAILJS_CONFIG = {
  serviceId: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,
  templateId: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
  userId: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY,
};

export async function sendAutomaticEmail(destinataire, titre, contenu) {
  if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId || !EMAILJS_CONFIG.userId) {
    console.warn('EmailJS non configuré (variables EXPO_PUBLIC_EMAILJS_* manquantes) : email non envoyé.');
    return;
  }
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.serviceId,
        template_id: EMAILJS_CONFIG.templateId,
        user_id: EMAILJS_CONFIG.userId,
        template_params: { to_email: destinataire, titre_alerte: titre, message_alerte: contenu }
      }),
    });
    if (!response.ok) console.log('Erreur serveur EmailJS');
  } catch (error) {
    console.error('Erreur réseau EmailJS :', error);
  }
}
