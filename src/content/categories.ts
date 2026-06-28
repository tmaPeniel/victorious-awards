import diplome from "@/assets/cat-diplome.jpg";
import cdi from "@/assets/cat-cdi.jpg";
import immobilier from "@/assets/cat-immobilier.jpg";
import permis from "@/assets/cat-permis.jpg";
import entreprise from "@/assets/cat-entreprise.jpg";
import plume from "@/assets/cat-plume.jpg";
import impact from "@/assets/cat-impact.jpg";
import album from "@/assets/cat-album.jpg";
import famille from "@/assets/cat-famille.jpg";

export type Category = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  criteria: string[];
  documents: string[];
  image: string;
};

export const categories: Category[] = [
  {
    slug: "diplome-fin-de-cycle",
    title: "Diplôme de fin de cycle",
    tagline: "Le sceau d'un long chemin",
    description:
      "Pour celles et ceux qui viennent de clôturer un cycle d'études — du baccalauréat au doctorat. Une victoire qui se prépare dans la patience, l'effort et la foi.",
    criteria: [
      "Avoir obtenu son diplôme entre juillet 2025 et juillet 2026",
      "Être membre ou ami régulier d'ICC Rouen",
      "Pouvoir partager une parole de reconnaissance",
    ],
    documents: ["Copie du diplôme ou attestation officielle", "Photo récente"],
    image: diplome,
  },
  {
    slug: "premier-cdi",
    title: "Premier CDI",
    tagline: "La signature qui change tout",
    description:
      "La fin d'une attente, le début d'une stabilité. Cette catégorie honore le premier contrat à durée indéterminée — petit ou grand, partout en France ou ailleurs.",
    criteria: [
      "Premier CDI signé entre juillet 2025 et juillet 2026",
      "Témoigner du chemin parcouru avant la signature",
    ],
    documents: ["Justificatif du contrat (1ère page suffit)", "Photo professionnelle ou personnelle"],
    image: cdi,
  },
  {
    slug: "premier-achat-immobilier",
    title: "Premier achat immobilier",
    tagline: "Les clés d'un toit à soi",
    description:
      "Devenir propriétaire pour la première fois — un cap symbolique, un jalon transmis. Nous célébrons l'audace et la rigueur de ce pas posé.",
    criteria: [
      "Premier bien acquis entre juillet 2025 et juillet 2026",
      "Acquisition à titre principal (résidence ou investissement)",
    ],
    documents: ["Attestation notariée ou compromis signé", "Photo du bien (optionnelle)"],
    image: immobilier,
  },
  {
    slug: "permis-de-conduire",
    title: "Permis de conduire",
    tagline: "L'horizon qui s'ouvre",
    description:
      "Le permis est une victoire trop souvent banalisée. Nous voulons l'honorer comme il le mérite : un pas vers la liberté, l'indépendance, et de nouveaux possibles.",
    criteria: [
      "Permis obtenu entre juillet 2025 et juillet 2026",
      "Tout type de permis (B, A, poids lourd, etc.)",
    ],
    documents: ["Copie du permis", "Photo récente"],
    image: permis,
  },
  {
    slug: "creation-d-entreprise",
    title: "Création d'entreprise",
    tagline: "L'audace de bâtir",
    description:
      "Pour les entrepreneurs qui ont franchi le pas et lancé leur structure. Auto-entreprise, SAS, association — chaque création est une étincelle.",
    criteria: [
      "Entreprise créée entre juillet 2025 et juillet 2026",
      "Activité en cours d'exercice au moment de la candidature",
    ],
    documents: ["Extrait K-bis ou SIREN", "Présentation succincte de l'activité"],
    image: entreprise,
  },
  {
    slug: "plume-inspiree",
    title: "Plume inspirée",
    tagline: "Pour ceux qui écrivent l'invisible",
    description:
      "Auteurs, poètes, blogueurs, scénaristes. Cette catégorie célèbre celles et ceux qui mettent en mots ce que beaucoup ressentent sans pouvoir le dire.",
    criteria: [
      "Œuvre publiée ou diffusée entre juillet 2025 et juillet 2026",
      "Tout format : livre, blog, recueil, scénario",
    ],
    documents: ["Lien ou extrait de l'œuvre", "Photo de l'auteur"],
    image: plume,
  },
  {
    slug: "impact-influenceur-du-royaume",
    title: "Impact & Influenceur du Royaume",
    tagline: "Une voix qui éclaire",
    description:
      "Pour celles et ceux dont la voix — sur scène, en ligne, ou dans le quotidien — porte un message d'espérance et bâtit autour d'elle.",
    criteria: [
      "Activité d'influence active depuis au moins 12 mois",
      "Message aligné avec les valeurs de Victorious",
    ],
    documents: ["Liens vers la plateforme principale", "Brève bio"],
    image: impact,
  },
  {
    slug: "premier-album-ou-single",
    title: "Premier album ou single",
    tagline: "La première note posée",
    description:
      "Le premier projet musical sorti — single, EP ou album. Une catégorie pour saluer le courage de faire entendre sa voix.",
    criteria: [
      "Projet sorti entre juillet 2025 et juillet 2026",
      "Distribution sur au moins une plateforme officielle",
    ],
    documents: ["Lien d'écoute (Spotify, Apple Music, YouTube…)", "Visuel du projet"],
    image: album,
  },
  {
    slug: "famille",
    title: "Famille",
    tagline: "Le socle qui tient debout",
    description:
      "Mariage, naissance, restauration. Cette catégorie célèbre les familles qui se construisent, se reconstruisent ou s'agrandissent dans la fidélité.",
    criteria: [
      "Événement familial marquant entre juillet 2025 et juillet 2026",
      "Témoignage personnel partagé en toute simplicité",
    ],
    documents: ["Justificatif (acte, certificat ou attestation)", "Photo de famille"],
    image: famille,
  },
];

export const getCategory = (slug: string) =>
  categories.find((c) => c.slug === slug);
