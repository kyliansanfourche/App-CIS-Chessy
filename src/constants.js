import { Info, Clock, TriangleAlert } from 'lucide-react-native';

export const TRAINING_STRUCTURE = [
  { id: 'm1', title: 'INCENDIE', goals: ['Établissement Lance', "Port de l'ARI", 'Sauvetage'] },
  { id: 'm2', title: 'SECOURS (SUAP)', goals: ['Bilan ABCDE', 'Arrêt Hémorragie', 'Réanimation'] },
  { id: 'm3', title: 'CONDUITE', goals: ['Vérification VL', 'Utilisation VSAV', 'Manœuvre PL'] },
  { id: 'm4', title: 'HABILITATIONS', goals: ['HDR - Radio', 'CATE - Tronçonneuse', 'CA1E'] },
];

export const ALERT_LEVELS = [
  { label: 'INFO', color: '#2A9D8F', icon: Info },
  { label: 'URGENT', color: '#F4A261', icon: Clock },
  { label: 'CRITIQUE', color: '#E63946', icon: TriangleAlert },
];
