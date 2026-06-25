import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import g5 from "@/assets/gallery-5.jpg";
import g6 from "@/assets/gallery-6.jpg";
import portrait from "@/assets/hero-portrait.jpg";
import bg from "@/assets/hero-bg.jpg";

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  type: "photo" | "video" | "replay";
  caption?: string;
  aspect: "portrait" | "landscape" | "square";
};

export const gallery: GalleryItem[] = [
  { id: "1", src: g1, alt: "Salle de gala sous le grand lustre", type: "photo", caption: "Ouverture — Édition précédente", aspect: "square" },
  { id: "2", src: g2, alt: "Lauréat sur scène avec son trophée", type: "photo", caption: "La remise du trophée", aspect: "portrait" },
  { id: "3", src: portrait, alt: "Portrait d'une invitée en tenue de soirée", type: "photo", caption: "Backstage", aspect: "portrait" },
  { id: "4", src: g3, alt: "Coupes de champagne levées pour un toast", type: "photo", caption: "Le toast d'honneur", aspect: "landscape" },
  { id: "5", src: g4, alt: "Couple élégant pendant la soirée", type: "photo", caption: "Rencontres", aspect: "portrait" },
  { id: "6", src: g5, alt: "Vue de scène avec faisceaux dorés", type: "video", caption: "Teaser officiel", aspect: "landscape" },
  { id: "7", src: g6, alt: "Invitée souriante sous les chandeliers", type: "photo", caption: "Le grand soir", aspect: "portrait" },
  { id: "8", src: bg, alt: "Salle de cérémonie vide en attente", type: "replay", caption: "Replay intégral 2024", aspect: "landscape" },
];
