import pasteurLuka from "@/assets/team/pasteur-luka.jpg";
import pasteurMarieAnge from "@/assets/team/pasteur-marie-ange.jpg";

export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  photo?: string;
  visionary?: boolean;
};

export const team: readonly TeamMember[] = [
  {
    name: "Pasteur Luka ANKOU",
    role: "Visionnaire & Pasteur principal",
    bio: "Visionnaire de Victorious — il porte depuis le premier jour le désir de voir l'Église reconnaître publiquement la fidélité de Dieu dans la vie de Son peuple.",
    photo: pasteurLuka,
    visionary: true,
  },
  {
    name: "Pasteur Marie-Ange ANKOU",
    role: "Visionnaire & Co-fondatrice",
    bio: "Co-visionnaire de Victorious — elle veille à ce que chaque histoire honorée le soit avec justesse, dignité et profondeur spirituelle.",
    photo: pasteurMarieAnge,
    visionary: true,
  },
  {
    name: "Esther",
    role: "Direction artistique",
    bio: "Architecte de la nuit. Elle compose la scénographie, le rythme et la beauté de chaque édition.",
  },
  {
    name: "David",
    role: "Coordination des catégories",
    bio: "Premier interlocuteur des candidats — il accompagne chaque dossier avec écoute et exigence.",
  },
  {
    name: "Sarah",
    role: "Communication & médias",
    bio: "Voix et image de Victorious sur les réseaux. Elle veille à ce que chaque histoire trouve son audience.",
  },
] as const;
