"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";

type DevelopIdeaProject = {
  id: number;

  sourceIndustryProjectId?: number;
  sourceIdeaId?: string;

  productName: string;
  industry: string;
  problem: string;
  customer: string;
  mainJob: string;

  packageIncludes: string;
  versionOne: string;
  priceIdeas: string;
  difference: string;

  visualStyle: string;
  visualNotes: string;

  imageGoal: string;
  imagePrompt: string;

  createdAt: string;
  updatedAt: string;
  status?: string;
};

type IncomingDevelopIdeaProject = {
  id: number;

  sourceIndustryProjectId?: number;
  sourceIdeaId?: string;

  industry?: string;
  productName?: string;

  targetUser?: string;
  customer?: string;

  problem?: string;

  oneJob?: string;
  mainJob?: string;

  currentWorkaround?: string;
  whyUseful?: string;

  versionOne?: string;

  pricingThought?: string;
  priceIdeas?: string;

  notes?: string;

  packageIncludes?: string;
  difference?: string;

  visualStyle?: string;
  visualNotes?: string;

  imageGoal?: string;
  imagePrompt?: string;

  createdAt?: string;
  updatedAt?: string;
  status?: string;
};

const STORAGE_KEY = "plantthevegan-develop-idea-projects";

const starterProject: Omit<
  DevelopIdeaProject,
  "id" | "createdAt" | "updatedAt"
> = {
  sourceIndustryProjectId: undefined,
  sourceIdeaId: undefined,

  productName: "",
  industry: "",
  problem: "",
  customer: "",
  mainJob: "",

  packageIncludes: "",
  versionOne: "",
  priceIdeas: "",
  difference: "",

  visualStyle: "",
  visualNotes: "",

  imageGoal: "",
  imagePrompt: "",

  status: "Developing",
};

function normalizeDevelopIdeaProject(
  project: IncomingDevelopIdeaProject,
): DevelopIdeaProject {
  const now = new Date().toLocaleString();

  const customer = project.customer?.trim() || project.targetUser?.trim() || "";

  const mainJob = project.mainJob?.trim() || project.oneJob?.trim() || "";

  const priceIdeas =
    project.priceIdeas?.trim() || project.pricingThought?.trim() || "";

  const difference =
    project.difference?.trim() || project.whyUseful?.trim() || "";

  const packageIncludes = project.packageIncludes?.trim() || "";

  const visualNotes =
    project.visualNotes?.trim() || project.notes?.trim() || "";

  return {
    id: typeof project.id === "number" ? project.id : Date.now(),

    sourceIndustryProjectId: project.sourceIndustryProjectId,

    sourceIdeaId: project.sourceIdeaId,

    productName: project.productName?.trim() || "",

    industry: project.industry?.trim() || "",

    problem: project.problem?.trim() || "",

    customer,

    mainJob,

    packageIncludes,

    versionOne: project.versionOne?.trim() || "",

    priceIdeas,

    difference,

    visualStyle: project.visualStyle?.trim() || "",

    visualNotes,

    imageGoal: project.imageGoal?.trim() || "",

    imagePrompt: project.imagePrompt?.trim() || "",

    createdAt: project.createdAt || now,

    updatedAt: project.updatedAt || project.createdAt || now,

    status: project.status || "Developing",
  };
}

export default function DevelopIdeaPage() {
  const [projects, setProjects] = useState<DevelopIdeaProject[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );

  const [form, setForm] = useState(starterProject);

  const [loaded, setLoaded] = useState(false);

  const [savedMessage, setSavedMessage] = useState("");

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [imageName, setImageName] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as IncomingDevelopIdeaProject[];

        if (Array.isArray(parsed)) {
          const normalized = parsed.map(normalizeDevelopIdeaProject);

          setProjects(normalized);

          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

          if (normalized.length > 0) {
            setSelectedProjectId(normalized[0].id);

            loadProjectIntoForm(normalized[0]);
          }
        }
      }
    } catch (error) {
      console.error("Could not load Develop Idea projects:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error("Could not save Develop Idea projects:", error);
    }
  }, [projects, loaded]);

  function loadProjectIntoForm(project: DevelopIdeaProject) {
    setForm({
      sourceIndustryProjectId: project.sourceIndustryProjectId,

      sourceIdeaId: project.sourceIdeaId,

      productName: project.productName,

      industry: project.industry,

      problem: project.problem,

      customer: project.customer,

      mainJob: project.mainJob,

      packageIncludes: project.packageIncludes,

      versionOne: project.versionOne,

      priceIdeas: project.priceIdeas,

      difference: project.difference,

      visualStyle: project.visualStyle,

      visualNotes: project.visualNotes,

      imageGoal: project.imageGoal,

      imagePrompt: project.imagePrompt,

      status: project.status || "Developing",
    });

    setImagePreview(null);
    setImageName("");
  }

  function updateField(field: keyof typeof starterProject, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSavedMessage("");
  }

  function createNewIdea() {
    setSelectedProjectId(null);

    setForm({
      ...starterProject,
    });

    setImagePreview(null);
    setImageName("");
    setSavedMessage("");
  }

  function saveIdea() {
    if (!form.productName.trim()) {
      window.alert("Add a product name first.");
      return;
    }

    const now = new Date().toLocaleString();

    if (selectedProjectId) {
      setProjects((current) =>
        current.map((project) =>
          project.id === selectedProjectId
            ? {
                ...project,
                ...form,
                updatedAt: now,
              }
            : project,
        ),
      );

      setSavedMessage("Idea updated.");

      return;
    }

    const newProject: DevelopIdeaProject = {
      id: Date.now(),

      ...form,

      createdAt: now,
      updatedAt: now,
    };

    setProjects((current) => [newProject, ...current]);

    setSelectedProjectId(newProject.id);

    setSavedMessage("Idea saved.");
  }

  function openProject(project: DevelopIdeaProject) {
    setSelectedProjectId(project.id);

    loadProjectIntoForm(project);

    setSavedMessage("");
  }

  function deleteProject(projectId: number) {
    const confirmed = window.confirm("Delete this Develop Idea project?");

    if (!confirmed) return;

    setProjects((current) =>
      current.filter((project) => project.id !== projectId),
    );

    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);

      setForm({
        ...starterProject,
      });

      setImagePreview(null);
      setImageName("");
    }
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImageName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };

    reader.readAsDataURL(file);
  }

  async function copyImagePrompt() {
    if (!form.imagePrompt.trim()) {
      window.alert("Add an image prompt first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(form.imagePrompt);

      setSavedMessage("Image prompt copied.");
    } catch {
      window.alert("Could not copy the prompt.");
    }
  }

  function generateStarterImagePrompt() {
    const productName = form.productName.trim() || "[PRODUCT NAME]";

    const customer = form.customer.trim() || "[TARGET CUSTOMER]";

    const problem = form.problem.trim() || "[PROBLEM IT SOLVES]";

    const mainJob = form.mainJob.trim() || "[ONE MAIN JOB]";

    const style = form.visualStyle.trim() || "clean, modern, professional";

    const visualNotes = form.visualNotes.trim();

    const goal = form.imageGoal.trim() || "digital product package mockup";

    const prompt = `Create a ${goal} for a focused digital product called "${productName}".

TARGET CUSTOMER:
${customer}

PROBLEM IT SOLVES:
${problem}

ONE MAIN JOB:
${mainJob}

VISUAL DIRECTION:
${style}

${
  visualNotes
    ? `ADDITIONAL DESIGN NOTES:
${visualNotes}

`
    : ""
}The design should look like a real product that could be sold online.

Keep the product message simple and immediately understandable.

The visual should communicate the ONE main job clearly.

Do not make it look like a giant all-in-one software platform.

Show the product in a polished presentation suitable for a website, product listing, sales page, or promotional graphic.

Do not add unrelated features or claims.`;

    updateField("imagePrompt", prompt);
  }

  return (
    <main className="min-h-screen bg-[#f5efe1] text-[#1a1a1a]">
      {/* HERO */}
      <section className="bg-[#333333] px-6 py-14 text-white sm:px-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/research"
            className="text-sm font-bold text-[#d8d4cb] transition hover:text-white"
          >
            ← Research System
          </Link>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-[#d8d4cb]">
            Stage 2
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
            Develop Idea
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#d8d4cb]">
            Take one strong opportunity and turn it into a clear product
            concept, offer, visual direction, and package design before you
            start building.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        {/* HANDOFF NOTICE */}
        {form.sourceIndustryProjectId && form.sourceIdeaId && (
          <div className="mb-8 rounded-3xl border-2 border-[#7a1d1d] bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
              From Industry Research
            </p>

            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Research winner received.
                </h2>

                <p className="mt-2 max-w-2xl text-black/60">
                  This product came from Stage 1. The industry, problem, buyer,
                  one job, Version 1, and pricing thoughts were carried forward
                  automatically.
                </p>
              </div>

              <Link
                href={`/research/industry-research/${form.sourceIndustryProjectId}`}
                className="shrink-0 rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-bold"
              >
                View Original Research →
              </Link>
            </div>
          </div>
        )}

        {/* TOP BAR */}
        <div className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
              Product Workspace
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {form.productName || "New Product Idea"}
            </h2>

            <p className="mt-1 text-sm text-black/50">
              Research → Product Concept → Visual Design → Build
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={createNewIdea}
              className="rounded-xl border border-black/15 bg-white px-5 py-3 font-bold transition hover:bg-black/5"
            >
              + New Idea
            </button>

            <button
              type="button"
              onClick={saveIdea}
              className="rounded-xl bg-[#7a1d1d] px-6 py-3 font-bold text-white transition hover:bg-[#681919]"
            >
              Save Idea
            </button>
          </div>
        </div>

        {savedMessage && (
          <div className="mt-4 rounded-2xl border border-black/10 bg-white px-5 py-4 font-bold">
            {savedMessage}
          </div>
        )}

        {/* PRODUCT SUMMARY */}
        <div className="mt-8 rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
            Section 1
          </p>

          <h2 className="mt-2 text-3xl font-bold">Product Summary</h2>

          <p className="mt-3 max-w-3xl leading-relaxed text-black/60">
            Define the product before worrying about features or design.
          </p>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Field
              label="Product Name"
              value={form.productName}
              placeholder="Example: DJ Duplicate Cleaner"
              onChange={(value) => updateField("productName", value)}
            />

            <Field
              label="Industry"
              value={form.industry}
              placeholder="Example: DJ software"
              onChange={(value) => updateField("industry", value)}
            />

            <TextAreaField
              label="Problem It Solves"
              value={form.problem}
              placeholder="What exact problem did your research uncover?"
              onChange={(value) => updateField("problem", value)}
            />

            <TextAreaField
              label="Who Is It For?"
              value={form.customer}
              placeholder="Who has this problem and may pay to solve it?"
              onChange={(value) => updateField("customer", value)}
            />
          </div>

          <div className="mt-5">
            <TextAreaField
              label="One Main Job"
              value={form.mainJob}
              placeholder="Example: Find and safely remove duplicate tracks from a DJ music library."
              onChange={(value) => updateField("mainJob", value)}
            />
          </div>

          <div className="mt-6 rounded-2xl bg-[#f5efe1] p-5">
            <p className="font-bold">Product Rule</p>

            <p className="mt-2 text-black/60">
              One product = one important job done very well.
            </p>
          </div>
        </div>

        {/* OFFER */}
        <div className="mt-8 rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
            Section 2
          </p>

          <h2 className="mt-2 text-3xl font-bold">Offer & Package</h2>

          <p className="mt-3 max-w-3xl leading-relaxed text-black/60">
            Work out what the buyer actually receives before building the
            product.
          </p>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <TextAreaField
              label="What Does the Buyer Get?"
              value={form.packageIncludes}
              placeholder="Software, dashboard, report, export, guide, files, templates..."
              onChange={(value) => updateField("packageIncludes", value)}
            />

            <TextAreaField
              label="Version 1"
              value={form.versionOne}
              placeholder="What is the smallest useful version of this product?"
              onChange={(value) => updateField("versionOne", value)}
            />

            <TextAreaField
              label="Price Ideas"
              value={form.priceIdeas}
              placeholder="One-time purchase, subscription, business price, starter price..."
              onChange={(value) => updateField("priceIdeas", value)}
            />

            <TextAreaField
              label="Why Would Someone Choose This?"
              value={form.difference}
              placeholder="What makes this easier, faster, simpler, cheaper, or more focused?"
              onChange={(value) => updateField("difference", value)}
            />
          </div>
        </div>

        {/* VISUAL DIRECTION */}
        <div className="mt-8 rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
            Section 3
          </p>

          <h2 className="mt-2 text-3xl font-bold">Visual Direction</h2>

          <p className="mt-3 max-w-3xl leading-relaxed text-black/60">
            Decide how you want the product to feel before generating package
            images and mockups.
          </p>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <TextAreaField
              label="Style"
              value={form.visualStyle}
              placeholder="Example: clean, modern, dark music-tech design, professional, simple..."
              onChange={(value) => updateField("visualStyle", value)}
            />

            <TextAreaField
              label="Design Notes"
              value={form.visualNotes}
              placeholder="Colors, layout ideas, examples you like, things to avoid..."
              onChange={(value) => updateField("visualNotes", value)}
            />
          </div>
        </div>

        {/* IMAGE DESIGN */}
        <div className="mt-8 rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
            Section 4
          </p>

          <h2 className="mt-2 text-3xl font-bold">Package & Image Design</h2>

          <p className="mt-3 max-w-3xl leading-relaxed text-black/60">
            Build the prompt for your product image, generate it in ChatGPT or
            another image tool, then bring your chosen design back here.
          </p>

          <div className="mt-7">
            <label className="mb-2 block text-sm font-bold">
              What Image Do You Want?
            </label>

            <select
              value={form.imageGoal}
              onChange={(event) => updateField("imageGoal", event.target.value)}
              className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 outline-none focus:border-[#7a1d1d]"
            >
              <option value="">Choose image type</option>

              <option value="digital product package image">
                Product Package Image
              </option>

              <option value="desktop software mockup">
                Desktop Software Mockup
              </option>

              <option value="mobile app mockup">Mobile App Mockup</option>

              <option value="website hero product image">
                Website Hero Image
              </option>

              <option value="product sales graphic">Sales Graphic</option>

              <option value="product feature graphic">Feature Graphic</option>
            </select>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={generateStarterImagePrompt}
              className="rounded-xl bg-[#333333] px-5 py-3 font-bold text-white"
            >
              Build Image Prompt
            </button>

            <button
              type="button"
              onClick={copyImagePrompt}
              className="rounded-xl border border-black/15 bg-white px-5 py-3 font-bold"
            >
              Copy Prompt
            </button>
          </div>

          <div className="mt-6">
            <TextAreaField
              label="Image Generation Prompt"
              value={form.imagePrompt}
              placeholder="Your image prompt will appear here."
              rows={12}
              onChange={(value) => updateField("imagePrompt", value)}
            />
          </div>

          <div className="mt-8 rounded-3xl bg-[#f5efe1] p-6">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#7a1d1d]">
              Bring Your Design Back
            </p>

            <h3 className="mt-2 text-2xl font-bold">Upload Generated Image</h3>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/60">
              Generate your mockup or package image, then upload it here while
              developing the idea.
            </p>

            <label className="mt-5 inline-block cursor-pointer rounded-xl bg-[#7a1d1d] px-5 py-3 font-bold text-white">
              Choose Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {imageName && (
              <p className="mt-3 text-sm font-bold text-black/55">
                {imageName}
              </p>
            )}

            {imagePreview ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white p-4">
                <img
                  src={imagePreview}
                  alt="Product design preview"
                  className="mx-auto max-h-[600px] w-auto rounded-xl"
                />
              </div>
            ) : (
              <div className="mt-6 flex min-h-[260px] items-center justify-center rounded-2xl border-2 border-dashed border-black/15 bg-white">
                <div className="text-center">
                  <p className="text-lg font-bold">No design uploaded yet.</p>

                  <p className="mt-2 text-sm text-black/50">
                    Your product mockup will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STAGE 3 */}
        <div className="mt-8 rounded-3xl bg-[#333333] p-7 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d8d4cb]">
            When the Idea Is Ready
          </p>

          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                Move from thinking to building.
              </h2>

              <p className="mt-3 max-w-2xl leading-relaxed text-[#d8d4cb]">
                Once the problem, buyer, Version 1, offer, and design direction
                are clear, move the product into Stage 3.
              </p>
            </div>

            <Link
              href="/research/build-product"
              className="shrink-0 rounded-xl bg-white px-6 py-3 font-bold text-[#1a1a1a]"
            >
              Move to Build Product →
            </Link>
          </div>
        </div>

        {/* SAVED IDEAS */}
        <div className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
                Saved Ideas
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Product Development Projects
              </h2>
            </div>

            <p className="text-sm font-bold text-black/45">
              {projects.length} {projects.length === 1 ? "idea" : "ideas"}
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-black/20 bg-white/50 p-10 text-center">
              <p className="text-xl font-bold">No product ideas saved yet.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`rounded-3xl border bg-white p-6 shadow-sm ${
                    selectedProjectId === project.id
                      ? "border-[#7a1d1d]"
                      : "border-black/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a1d1d]">
                        Product Idea
                      </p>

                      <h3 className="mt-2 text-2xl font-bold">
                        {project.productName}
                      </h3>
                    </div>

                    {project.sourceIdeaId && (
                      <span className="rounded-full bg-[#f5efe1] px-3 py-1 text-xs font-bold text-[#7a1d1d]">
                        Research Winner
                      </span>
                    )}
                  </div>

                  {project.industry && (
                    <p className="mt-2 text-sm text-black/50">
                      {project.industry}
                    </p>
                  )}

                  {project.mainJob && (
                    <div className="mt-4 rounded-2xl bg-[#f5efe1] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-black/45">
                        Main Job
                      </p>

                      <p className="mt-2 text-sm leading-relaxed text-black/65">
                        {project.mainJob}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => openProject(project)}
                      className="font-bold text-[#7a1d1d]"
                    >
                      Open Idea →
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteProject(project.id)}
                      className="text-sm font-bold text-black/35 transition hover:text-[#7a1d1d]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

function Field({ label, value, placeholder, onChange }: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold">{label}</label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 outline-none transition focus:border-[#7a1d1d]"
      />
    </div>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  rows?: number;
};

function TextAreaField({
  label,
  value,
  placeholder,
  onChange,
  rows = 5,
}: TextAreaFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold">{label}</label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-2xl border border-black/15 bg-white px-4 py-4 outline-none transition focus:border-[#7a1d1d]"
      />
    </div>
  );
}
