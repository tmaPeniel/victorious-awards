import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowLeft, ArrowRight, ImagePlus, Sparkles, X } from "lucide-react";
import { z } from "zod";
import { Section } from "@/components/victorious/Section";
import { VButton, VLink } from "@/components/victorious/VButton";
import { categories } from "@/content/categories";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/candidater")({
  head: () => ({
    meta: [
      { title: "Candidater — Victorious | ICC Rouen" },
      {
        name: "description",
        content:
          "Proposez votre histoire à Victorious grâce à un parcours de candidature guidé pour les 9 catégories de la cérémonie.",
      },
      { property: "og:title", content: "Candidater — Victorious" },
      {
        property: "og:description",
        content:
          "Choisissez votre catégorie, complétez vos informations et partagez votre témoignage.",
      },
    ],
  }),
  component: CandidaterPage,
});

const schema = z
  .object({
    category: z.string().min(1, "Choisissez une catégorie"),
    civility: z.enum(["Madame", "Monsieur"], {
      message: "Choisissez une civilité",
    }),
    firstName: z.string().trim().min(2, "Prénom requis").max(60),
    lastName: z.string().trim().min(2, "Nom requis").max(60),
    email: z.string().trim().email("Email invalide").max(255),
    phone: z.string().trim().min(8, "Téléphone requis").max(20),
    city: z.string().min(1, "Ville requise"),
    otherCity: z.string().trim().max(100),
    testimony: z.string().trim().max(2000).optional().or(z.literal("")),
    rgpd: z.literal(true, { message: "Acceptation requise" }),
  })
  .superRefine((data, ctx) => {
    if (data.city === "Autre" && data.otherCity.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["otherCity"],
        message: "Précisez votre ville",
      });
    }
  });

type FormState = {
  category: string;
  civility: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  otherCity: string;
  testimony: string;
  rgpd: boolean;
};

const initial: FormState = {
  category: "",
  civility: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  otherCity: "",
  testimony: "",
  rgpd: false,
};

const STEPS = [
  { n: "01", label: "Conditions" },
  { n: "02", label: "Catégorie" },
  { n: "03", label: "Vous" },
  { n: "04", label: "Témoignage" },
  { n: "05", label: "Confirmation" },
];

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function CandidaterPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const preview = URL.createObjectURL(photo);
    setPhotoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [photo]);

  const update =
    <K extends keyof FormState>(key: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val =
        e.target instanceof HTMLInputElement && e.target.type === "checkbox"
          ? e.target.checked
          : e.target.value;
      setForm((f) => ({ ...f, [key]: val as FormState[K] }));
    };

  const FIELD_TO_STEP: Record<string, number> = {
    category: 1,
    civility: 2,
    firstName: 2,
    lastName: 2,
    email: 2,
    phone: 2,
    city: 2,
    otherCity: 2,
    testimony: 3,
    rgpd: 3,
  };
  const FIELD_LABEL: Record<string, string> = {
    category: "Catégorie",
    civility: "Civilité",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Email",
    phone: "Téléphone",
    city: "Ville",
    otherCity: "Votre ville",
    testimony: "Témoignage",
    rgpd: "Acceptation RGPD",
  };

  const validate = (): boolean => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string") errs[k] = issue.message;
      }
      setErrors(errs);
      // Jump to the first step containing an invalid field
      const firstStep = Object.keys(errs)
        .map((k) => FIELD_TO_STEP[k] ?? 99)
        .sort((a, b) => a - b)[0];
      if (typeof firstStep === "number" && firstStep < STEPS.length) {
        setStep(firstStep);
      }
      const missing = Object.keys(errs)
        .map((k) => FIELD_LABEL[k] ?? k)
        .join(", ");
      setSubmitError(`Merci de compléter : ${missing}.`);
      return false;
    }
    setErrors({});
    setSubmitError(null);
    return true;
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const selectPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        photo: "Choisissez une image JPG, PNG ou WebP.",
      }));
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setErrors((current) => ({
        ...current,
        photo: "La photo ne doit pas dépasser 5 Mo.",
      }));
      return;
    }

    setPhoto(file);
    setErrors((current) => {
      const { photo: _photoError, ...rest } = current;
      return rest;
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const city = form.city === "Autre" ? form.otherCity.trim() : form.city;
      let photoPath: string | null = null;

      if (photo) {
        const extension = PHOTO_EXTENSIONS[photo.type];
        photoPath = `photos/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("application-files")
          .upload(photoPath, photo, {
            cacheControl: "3600",
            contentType: photo.type,
            upsert: false,
          });
        if (uploadError) {
          throw new Error("La photo n’a pas pu être envoyée. Merci de réessayer.");
        }
      }

      const { error: insertErr } = await supabase.from("applications").insert({
        category_slug: form.category,
        civility: form.civility,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city,
        testimony: (form.testimony ?? "").trim(),
        photo_path: photoPath,
      });
      if (insertErr) {
        if (insertErr.message.includes("duplicate_application_same_category")) {
          throw new Error(
            "Une candidature existe déjà avec cette adresse e-mail dans cette catégorie.",
          );
        }
        throw new Error(insertErr.message ?? "Échec de l'enregistrement de la candidature.");
      }

      setDone(true);
      setStep(STEPS.length - 1);
    } catch (err) {
      console.error(err);
      setSubmitError(
        err instanceof Error ? err.message : "Une erreur est survenue. Merci de réessayer.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="bg-obsidian pt-40 pb-12">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.4em] text-champagne/70">
            <span className="h-px w-12 bg-champagne/50" />
            Candidater
          </div>
          <h1 className="mt-8 font-display text-5xl leading-[0.95] text-ivory sm:text-6xl lg:text-7xl">
            Votre histoire,
            <br />
            <span className="font-display-italic text-champagne">en quelques minutes.</span>
          </h1>
        </div>
      </section>

      <Section contained={false} className="pt-8">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          {/* Stepper */}
          <ol className="mb-16 flex flex-wrap gap-x-6 gap-y-3 border-y border-champagne/15 py-5">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                className={cn(
                  "flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.25em] transition-colors",
                  i === step ? "text-champagne" : i < step ? "text-ivory/50" : "text-ivory/30",
                )}
              >
                <span className="font-display text-base">{s.n}</span>
                <span>{s.label}</span>
                {i < STEPS.length - 1 && <span className="ml-4 h-px w-6 bg-champagne/20" />}
              </li>
            ))}
          </ol>

          <form onSubmit={submit} className="space-y-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Step 0 — Conditions */}
                {step === 0 && (
                  <div className="space-y-6">
                    <h2 className="font-display text-3xl text-ivory">Avant de commencer</h2>
                    <ul className="space-y-4 text-base text-ivory/75">
                      {[
                        "Votre victoire se situe entre juillet 2025 et juillet 2026.",
                        "Vous pouvez partager un témoignage sincère et personnel.",
                        "Vous acceptez d'être contacté pour la suite du processus.",
                      ].map((c) => (
                        <li key={c} className="flex gap-4">
                          <Check className="mt-1 size-5 shrink-0 text-gold" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Step 1 — Catégorie */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="font-display text-3xl text-ivory">Choisissez votre catégorie</h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {categories.map((cat) => (
                        <label
                          key={cat.slug}
                          className={cn(
                            "group cursor-pointer border p-5 transition-all",
                            form.category === cat.slug
                              ? "border-champagne bg-champagne/5"
                              : "border-champagne/20 hover:border-champagne/50",
                          )}
                        >
                          <input
                            type="radio"
                            name="category"
                            value={cat.slug}
                            checked={form.category === cat.slug}
                            onChange={() => setForm((f) => ({ ...f, category: cat.slug }))}
                            className="sr-only"
                          />
                          <div className="font-display text-lg text-ivory">{cat.title}</div>
                          <div className="mt-1 text-xs text-champagne/70">{cat.tagline}</div>
                        </label>
                      ))}
                    </div>
                    {errors.category && (
                      <p className="text-sm text-destructive">{errors.category}</p>
                    )}
                  </div>
                )}

                {/* Step 2 — Identité */}
                {step === 2 && (
                  <div className="space-y-8">
                    <h2 className="font-display text-3xl text-ivory">Vous</h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="f-civility"
                          className="block text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70"
                        >
                          Civilité
                        </label>
                        <select
                          id="f-civility"
                          name="civility"
                          value={form.civility}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, civility: e.target.value }))
                          }
                          className="mt-2 w-full border-b border-champagne/30 bg-obsidian px-0 py-3 font-sans text-base text-ivory outline-none transition-colors focus:border-champagne"
                        >
                          <option value="">Sélectionnez votre civilité</option>
                          <option value="Madame">Madame</option>
                          <option value="Monsieur">Monsieur</option>
                        </select>
                        <div className="mt-1 text-xs">
                          {errors.civility ? (
                            <span className="text-destructive">{errors.civility}</span>
                          ) : (
                            <span className="text-ivory/40">&nbsp;</span>
                          )}
                        </div>
                      </div>
                      <Field
                        label="Prénom"
                        name="firstName"
                        value={form.firstName}
                        onChange={update("firstName")}
                        error={errors.firstName}
                      />
                      <Field
                        label="Nom"
                        name="lastName"
                        value={form.lastName}
                        onChange={update("lastName")}
                        error={errors.lastName}
                      />
                      <Field
                        label="Email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={update("email")}
                        error={errors.email}
                      />
                      <Field
                        label="Téléphone"
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={update("phone")}
                        error={errors.phone}
                      />
                      <div>
                        <label
                          htmlFor="f-city"
                          className="block text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70"
                        >
                          Ville
                        </label>
                        <select
                          id="f-city"
                          name="city"
                          value={form.city}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              city: e.target.value,
                              otherCity: e.target.value === "Autre" ? f.otherCity : "",
                            }))
                          }
                          className="mt-2 w-full border-b border-champagne/30 bg-obsidian px-0 py-3 font-sans text-base text-ivory outline-none transition-colors focus:border-champagne"
                        >
                          <option value="">Sélectionnez une ville</option>
                          {[
                            "Rouen",
                            "Caen",
                            "Le Havre",
                            "Dieppe",
                            "Cherbourg",
                            "Evreux",
                            "Autre",
                          ].map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        <div className="mt-1 text-xs">
                          {errors.city ? (
                            <span className="text-destructive">{errors.city}</span>
                          ) : (
                            <span className="text-ivory/40">&nbsp;</span>
                          )}
                        </div>
                      </div>
                      {form.city === "Autre" && (
                        <Field
                          label="Précisez votre ville"
                          name="otherCity"
                          value={form.otherCity}
                          onChange={update("otherCity")}
                          error={errors.otherCity}
                        />
                      )}
                      <div className="sm:col-span-2">
                        <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
                          Photo{" "}
                          <span className="normal-case tracking-normal text-ivory/40">
                            (facultative)
                          </span>
                        </div>
                        <div className="mt-3 flex flex-col gap-4 border border-dashed border-champagne/30 p-4 sm:flex-row sm:items-center">
                          {photoPreview ? (
                            <img
                              src={photoPreview}
                              alt="Aperçu de la photo sélectionnée"
                              className="size-24 shrink-0 object-cover"
                            />
                          ) : (
                            <div className="grid size-24 shrink-0 place-items-center bg-champagne/5 text-champagne/60">
                              <ImagePlus className="size-8" aria-hidden="true" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-ivory/65">
                              Ajoutez une photo de vous au format JPG, PNG ou WebP, 5 Mo maximum.
                            </p>
                            {photo && (
                              <p className="mt-1 truncate text-xs text-ivory/45">{photo.name}</p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-3">
                              <label
                                htmlFor="f-photo"
                                className="inline-flex cursor-pointer items-center gap-2 border border-champagne/40 px-4 py-2 text-xs uppercase tracking-[0.18em] text-champagne transition-colors hover:border-champagne hover:text-ivory"
                              >
                                <ImagePlus className="size-4" aria-hidden="true" />
                                {photo ? "Changer" : "Choisir une photo"}
                              </label>
                              <input
                                id="f-photo"
                                name="photo"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={selectPhoto}
                                className="sr-only"
                              />
                              {photo && (
                                <button
                                  type="button"
                                  onClick={() => setPhoto(null)}
                                  className="inline-flex items-center gap-2 px-2 py-2 text-xs uppercase tracking-[0.18em] text-ivory/55 hover:text-ivory"
                                >
                                  <X className="size-4" aria-hidden="true" /> Retirer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {errors.photo && (
                          <p className="mt-2 text-sm text-destructive">{errors.photo}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3 — Témoignage */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="font-display text-3xl text-ivory">Votre témoignage</h2>
                    <p className="text-base text-ivory/65">
                      Racontez votre histoire. Pas de plan. Pas de filtre. Quelques lignes suffisent
                      — l'authenticité fera le reste.
                    </p>
                    <Field
                      label="Témoignage (optionnel)"
                      name="testimony"
                      textarea
                      value={form.testimony}
                      onChange={update("testimony")}
                      error={errors.testimony}
                      hint={`${form.testimony.length} / 2000`}
                    />
                    <label className="flex items-start gap-3 text-sm text-ivory/70">
                      <input
                        type="checkbox"
                        checked={form.rgpd}
                        onChange={(e) => setForm((f) => ({ ...f, rgpd: e.target.checked }))}
                        className="mt-1 size-4 accent-champagne"
                      />
                      <span>
                        J'accepte que mes données soient utilisées pour le traitement de ma
                        candidature, conformément aux mentions légales.
                      </span>
                    </label>
                    {errors.rgpd && <p className="text-sm text-destructive">{errors.rgpd}</p>}
                  </div>
                )}

                {/* Step 4 — Confirmation */}
                {step === 4 && done && (
                  <div className="py-12 text-center">
                    <div className="mx-auto grid size-20 place-items-center rounded-full border border-champagne/30 bg-champagne/10">
                      <Sparkles className="size-8 text-gold" />
                    </div>
                    <h2 className="mt-8 font-display text-4xl text-ivory sm:text-5xl">
                      Merci, {form.firstName}.
                    </h2>
                    <p className="mx-auto mt-6 max-w-lg text-pretty text-lg text-ivory/70">
                      Votre candidature a été reçue. Notre comité prend le temps d'examiner chaque
                      histoire avec attention. Vous serez recontacté avant la cérémonie.
                    </p>
                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                      <VLink to="/" variant="secondary">
                        Retour à l'accueil
                      </VLink>
                      <VLink to="/galerie">Découvrir la galerie</VLink>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Nav */}
            {!done && (
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-champagne/15 pt-8">
                <VButton
                  type="button"
                  variant="ghost"
                  onClick={back}
                  disabled={step === 0}
                  className="disabled:opacity-30"
                >
                  <ArrowLeft className="size-4" /> Retour
                </VButton>
                {step < 3 ? (
                  <VButton
                    type="button"
                    onClick={() => {
                      if (step === 1 && !form.category) {
                        setErrors({ category: "Choisissez une catégorie" });
                        return;
                      }
                      next();
                    }}
                  >
                    Continuer <ArrowRight className="size-4" />
                  </VButton>
                ) : (
                  <VButton type="submit" disabled={submitting}>
                    {submitting ? "Envoi en cours…" : "Envoyer ma candidature"}{" "}
                    <ArrowRight className="size-4" />
                  </VButton>
                )}
              </div>
            )}
            {submitError && (
              <p role="alert" className="text-center text-sm text-destructive">
                {submitError}
              </p>
            )}
          </form>

          {!done && (
            <p className="mt-12 text-center text-xs uppercase tracking-[0.25em] text-ivory/40">
              Une question ?{" "}
              <Link to="/contact" className="link-underline text-champagne">
                Contactez-nous
              </Link>
            </p>
          )}
        </div>
      </Section>
    </>
  );
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  textarea?: boolean;
  error?: string;
  hint?: string;
};

function Field({ label, name, value, onChange, type = "text", textarea, error, hint }: FieldProps) {
  const id = `f-${name}`;
  const baseCls =
    "w-full bg-transparent border-b border-champagne/30 px-0 py-3 font-sans text-base text-ivory placeholder:text-ivory/30 outline-none focus:border-champagne transition-colors";
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70"
      >
        {label}
      </label>
      {textarea ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          rows={6}
          className={cn(baseCls, "mt-2 resize-y")}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className={cn(baseCls, "mt-2")}
        />
      )}
      <div className="mt-1 flex justify-between text-xs">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : (
          <span className="text-ivory/40">{hint ?? "\u00A0"}</span>
        )}
      </div>
    </div>
  );
}
