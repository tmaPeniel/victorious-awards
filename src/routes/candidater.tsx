import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowLeft, ArrowRight, Upload, Sparkles } from "lucide-react";
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
          "Proposez votre histoire à Victorious. Formulaire de candidature en 4 étapes pour les 9 catégories de la cérémonie.",
      },
      { property: "og:title", content: "Candidater — Victorious" },
      {
        property: "og:description",
        content:
          "Choisissez votre catégorie, partagez votre témoignage, déposez vos pièces.",
      },
    ],
  }),
  component: CandidaterPage,
});

const schema = z.object({
  category: z.string().min(1, "Choisissez une catégorie"),
  firstName: z.string().trim().min(2, "Prénom requis").max(60),
  lastName: z.string().trim().min(2, "Nom requis").max(60),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(8, "Téléphone requis").max(20),
  testimony: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("")),
  rgpd: z.literal(true, { message: "Acceptation requise" }),
});

type FormState = {
  category: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  testimony: string;
  photoFile: File | null;
  rgpd: boolean;
};

const initial: FormState = {
  category: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  testimony: "",
  photoFile: null,
  rgpd: false,
};

const STEPS = [
  { n: "01", label: "Conditions" },
  { n: "02", label: "Catégorie" },
  { n: "03", label: "Vous" },
  { n: "04", label: "Témoignage" },
  { n: "05", label: "Photo" },
  { n: "06", label: "Confirmation" },
];

function CandidaterPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update =
    <K extends keyof FormState>(key: K) =>
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const val =
        e.target instanceof HTMLInputElement && e.target.type === "checkbox"
          ? e.target.checked
          : e.target.value;
      setForm((f) => ({ ...f, [key]: val as FormState[K] }));
    };

  const file = (key: "photoFile") => (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setForm((s) => ({ ...s, [key]: f }));
  };

  const FIELD_TO_STEP: Record<string, number> = {
    category: 1,
    firstName: 2,
    lastName: 2,
    email: 2,
    phone: 2,
    testimony: 3,
    rgpd: 4,
  };
  const FIELD_LABEL: Record<string, string> = {
    category: "Catégorie",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Email",
    phone: "Téléphone",
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

  const sanitize = (name: string) =>
    name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Generate ID client-side so we can upload files before the insert
      // (anon has INSERT on applications but no UPDATE — single insert is required).
      const appId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      let photo_path: string | undefined;

      // 1. Upload photo (best-effort — failure does not block submission)
      if (form.photoFile) {
        const path = `${appId}/photo-${sanitize(form.photoFile.name)}`;
        const { error } = await supabase.storage
          .from("application-files")
          .upload(path, form.photoFile, { upsert: false });
        if (error) {
          console.warn("photo upload failed", error);
        } else {
          photo_path = path;
        }
      }

      // 2. Create application row with everything in one insert
      const { error: insertErr } = await supabase.from("applications").insert({
        id: appId,
        category_slug: form.category,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        testimony: (form.testimony ?? "").trim(),
        photo_path,
      });
      if (insertErr) {
        throw new Error(
          insertErr.message ?? "Échec de l'enregistrement de la candidature.",
        );
      }

      setDone(true);
      setStep(STEPS.length - 1);
    } catch (err) {
      console.error(err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue. Merci de réessayer.",
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
            <span className="font-display-italic text-champagne">
              en quelques minutes.
            </span>
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
                  i === step
                    ? "text-champagne"
                    : i < step
                      ? "text-ivory/50"
                      : "text-ivory/30",
                )}
              >
                <span className="font-display text-base">{s.n}</span>
                <span>{s.label}</span>
                {i < STEPS.length - 1 && (
                  <span className="ml-4 h-px w-6 bg-champagne/20" />
                )}
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
                    <h2 className="font-display text-3xl text-ivory">
                      Avant de commencer
                    </h2>
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
                    <h2 className="font-display text-3xl text-ivory">
                      Choisissez votre catégorie
                    </h2>
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
                            onChange={() =>
                              setForm((f) => ({ ...f, category: cat.slug }))
                            }
                            className="sr-only"
                          />
                          <div className="font-display text-lg text-ivory">
                            {cat.title}
                          </div>
                          <div className="mt-1 text-xs text-champagne/70">
                            {cat.tagline}
                          </div>
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
                    </div>
                  </div>
                )}

                {/* Step 3 — Témoignage */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="font-display text-3xl text-ivory">
                      Votre témoignage
                    </h2>
                    <p className="text-base text-ivory/65">
                      Racontez votre histoire. Pas de plan. Pas de filtre. Quelques
                      lignes suffisent — l'authenticité fera le reste.
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
                  </div>
                )}

                {/* Step 4 — Pièces */}
                {step === 4 && (
                  <div className="space-y-8">
                    <h2 className="font-display text-3xl text-ivory">
                      Votre photo
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <FileField
                        label="Photo"
                        name="photo"
                        value={form.photoFile?.name ?? ""}
                        onChange={file("photoFile")}
                        accept="image/*"
                      />
                    </div>
                    <label className="flex items-start gap-3 text-sm text-ivory/70">
                      <input
                        type="checkbox"
                        checked={form.rgpd}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, rgpd: e.target.checked }))
                        }
                        className="mt-1 size-4 accent-champagne"
                      />
                      <span>
                        J'accepte que mes données soient utilisées pour le
                        traitement de ma candidature, conformément aux mentions
                        légales.
                      </span>
                    </label>
                    {errors.rgpd && (
                      <p className="text-sm text-destructive">{errors.rgpd}</p>
                    )}
                  </div>
                )}

                {/* Step 5 — Confirmation */}
                {step === 5 && done && (
                  <div className="py-12 text-center">
                    <div className="mx-auto grid size-20 place-items-center rounded-full border border-champagne/30 bg-champagne/10">
                      <Sparkles className="size-8 text-gold" />
                    </div>
                    <h2 className="mt-8 font-display text-4xl text-ivory sm:text-5xl">
                      Merci, {form.firstName}.
                    </h2>
                    <p className="mx-auto mt-6 max-w-lg text-pretty text-lg text-ivory/70">
                      Votre candidature a été reçue. Notre comité prend le temps
                      d'examiner chaque histoire avec attention. Vous serez
                      recontacté avant la cérémonie.
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
                {step < 4 ? (
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
              <p
                role="alert"
                className="text-center text-sm text-destructive"
              >
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

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  textarea,
  error,
  hint,
}: FieldProps) {
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

function FileField({
  label,
  name,
  value,
  onChange,
  accept,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
}) {
  const id = `file-${name}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-start gap-3 border border-dashed border-champagne/40 p-6 transition-colors hover:border-champagne hover:bg-champagne/5"
      >
        <div className="flex items-center gap-3 text-champagne">
          <Upload className="size-5" />
          <span className="text-[0.7rem] uppercase tracking-[0.25em]">
            {label}
          </span>
        </div>
        <div className="text-sm text-ivory/70">
          {value || "Cliquez pour téléverser un fichier"}
        </div>
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={onChange}
          className="sr-only"
        />
      </label>
    </div>
  );
}
