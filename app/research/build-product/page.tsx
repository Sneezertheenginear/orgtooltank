"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

type BuildTask = {
  id: string;
  title: string;
  completed: boolean;
};

type BuildProductProject = {
  id: number;

  sourceDevelopIdeaId: number;

  productName: string;
  industry: string;
  problem: string;
  customer: string;
  mainJob: string;

  versionOne: string;
  packageIncludes: string;
  priceIdeas: string;
  difference: string;

  visualStyle: string;
  visualNotes: string;

  buildPlan: string;
  technicalNotes: string;

  tasks: BuildTask[];

  testNotes: string;
  issuesFound: string;
  fixesNeeded: string;

  releaseNotes: string;
  launchChecklist: BuildTask[];

  createdAt: string;
  updatedAt: string;
  status: string;
};

const DEVELOP_STORAGE_KEY = "plantthevegan-develop-idea-projects";

const BUILD_STORAGE_KEY = "plantthevegan-build-product-projects";

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultBuildTasks(): BuildTask[] {
  return [
    {
      id: makeId("task"),
      title: "Define the exact Version 1 workflow",
      completed: false,
    },
    {
      id: makeId("task"),
      title: "Build the core one-job function",
      completed: false,
    },
    {
      id: makeId("task"),
      title: "Add basic user interface",
      completed: false,
    },
    {
      id: makeId("task"),
      title: "Add safety and error handling",
      completed: false,
    },
    {
      id: makeId("task"),
      title: "Test with realistic examples",
      completed: false,
    },
    {
      id: makeId("task"),
      title: "Fix major problems found in testing",
      completed: false,
    },
  ];
}

function createDefaultLaunchChecklist(): BuildTask[] {
  return [
    {
      id: makeId("launch"),
      title: "Version 1 works from beginning to end",
      completed: false,
    },
    {
      id: makeId("launch"),
      title: "No major known bugs",
      completed: false,
    },
    {
      id: makeId("launch"),
      title: "Product name and description are final",
      completed: false,
    },
    {
      id: makeId("launch"),
      title: "Price is decided",
      completed: false,
    },
    {
      id: makeId("launch"),
      title: "Product image or mockup is ready",
      completed: false,
    },
    {
      id: makeId("launch"),
      title: "Basic sales page or product listing is ready",
      completed: false,
    },
  ];
}

export default function BuildProductPage() {
  const [developIdeas, setDevelopIdeas] = useState<DevelopIdeaProject[]>([]);

  const [buildProjects, setBuildProjects] = useState<BuildProductProject[]>([]);

  const [selectedBuildId, setSelectedBuildId] = useState<number | null>(null);

  const [loaded, setLoaded] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const savedDevelopIdeas =
        window.localStorage.getItem(DEVELOP_STORAGE_KEY);

      if (savedDevelopIdeas) {
        const parsed = JSON.parse(savedDevelopIdeas) as DevelopIdeaProject[];

        if (Array.isArray(parsed)) {
          setDevelopIdeas(parsed);
        }
      }

      const savedBuildProjects = window.localStorage.getItem(BUILD_STORAGE_KEY);

      if (savedBuildProjects) {
        const parsed = JSON.parse(savedBuildProjects) as BuildProductProject[];

        if (Array.isArray(parsed)) {
          setBuildProjects(parsed);

          if (parsed.length > 0) {
            setSelectedBuildId(parsed[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Could not load Build Product data:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      window.localStorage.setItem(
        BUILD_STORAGE_KEY,
        JSON.stringify(buildProjects),
      );
    } catch (error) {
      console.error("Could not save Build Product projects:", error);
    }
  }, [buildProjects, loaded]);

  const selectedProject = useMemo(() => {
    return (
      buildProjects.find((project) => project.id === selectedBuildId) || null
    );
  }, [buildProjects, selectedBuildId]);

  const buildProgress = useMemo(() => {
    if (!selectedProject) return 0;

    if (selectedProject.tasks.length === 0) return 0;

    const completed = selectedProject.tasks.filter(
      (task) => task.completed,
    ).length;

    return Math.round((completed / selectedProject.tasks.length) * 100);
  }, [selectedProject]);

  const launchProgress = useMemo(() => {
    if (!selectedProject) return 0;

    if (selectedProject.launchChecklist.length === 0) return 0;

    const completed = selectedProject.launchChecklist.filter(
      (task) => task.completed,
    ).length;

    return Math.round(
      (completed / selectedProject.launchChecklist.length) * 100,
    );
  }, [selectedProject]);

  function startBuildFromIdea(idea: DevelopIdeaProject) {
    const existing = buildProjects.find(
      (project) => project.sourceDevelopIdeaId === idea.id,
    );

    if (existing) {
      setSelectedBuildId(existing.id);

      setMessage("This product already has a Build Product workspace.");

      return;
    }

    const now = new Date().toLocaleString();

    const buildProject: BuildProductProject = {
      id: Date.now(),

      sourceDevelopIdeaId: idea.id,

      productName: idea.productName,
      industry: idea.industry,
      problem: idea.problem,
      customer: idea.customer,
      mainJob: idea.mainJob,

      versionOne: idea.versionOne,
      packageIncludes: idea.packageIncludes,
      priceIdeas: idea.priceIdeas,
      difference: idea.difference,

      visualStyle: idea.visualStyle,
      visualNotes: idea.visualNotes,

      buildPlan: "",
      technicalNotes: "",

      tasks: createDefaultBuildTasks(),

      testNotes: "",
      issuesFound: "",
      fixesNeeded: "",

      releaseNotes: "",

      launchChecklist: createDefaultLaunchChecklist(),

      createdAt: now,
      updatedAt: now,

      status: "Building",
    };

    setBuildProjects((current) => [buildProject, ...current]);

    setSelectedBuildId(buildProject.id);

    setMessage(`${idea.productName} moved into Stage 3 — Build Product.`);
  }

  function updateProject(field: keyof BuildProductProject, value: string) {
    if (!selectedProject) return;

    setBuildProjects((current) =>
      current.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              [field]: value,
              updatedAt: new Date().toLocaleString(),
            }
          : project,
      ),
    );

    setMessage("");
  }

  function toggleBuildTask(taskId: string) {
    if (!selectedProject) return;

    setBuildProjects((current) =>
      current.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,

              tasks: project.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      completed: !task.completed,
                    }
                  : task,
              ),

              updatedAt: new Date().toLocaleString(),
            }
          : project,
      ),
    );
  }

  function addBuildTask() {
    if (!selectedProject) return;

    const title = window.prompt("What needs to be built?");

    if (!title?.trim()) return;

    const newTask: BuildTask = {
      id: makeId("task"),
      title: title.trim(),
      completed: false,
    };

    setBuildProjects((current) =>
      current.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              tasks: [...project.tasks, newTask],
            }
          : project,
      ),
    );
  }

  function deleteBuildTask(taskId: string) {
    if (!selectedProject) return;

    setBuildProjects((current) =>
      current.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,

              tasks: project.tasks.filter((task) => task.id !== taskId),
            }
          : project,
      ),
    );
  }

  function toggleLaunchTask(taskId: string) {
    if (!selectedProject) return;

    setBuildProjects((current) =>
      current.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,

              launchChecklist: project.launchChecklist.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      completed: !task.completed,
                    }
                  : task,
              ),

              updatedAt: new Date().toLocaleString(),
            }
          : project,
      ),
    );
  }

  function deleteBuildProject(projectId: number) {
    const confirmed = window.confirm("Delete this Build Product project?");

    if (!confirmed) return;

    setBuildProjects((current) =>
      current.filter((project) => project.id !== projectId),
    );

    if (selectedBuildId === projectId) {
      setSelectedBuildId(null);
    }
  }

  function markReadyForRelease() {
    if (!selectedProject) return;

    setBuildProjects((current) =>
      current.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              status: "Ready for Release",
              updatedAt: new Date().toLocaleString(),
            }
          : project,
      ),
    );

    setMessage("Product marked Ready for Release.");
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#f5efe1] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-bold">Loading Build Product...</p>
        </div>
      </main>
    );
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
            Stage 3
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
            Build Product
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#d8d4cb]">
            Take the approved product concept, build Version 1, test it, fix
            what is broken, and prepare it for release.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        {message && (
          <div className="mb-6 rounded-2xl border border-black/10 bg-white px-5 py-4 font-bold">
            {message}
          </div>
        )}

        {/* DEVELOPED IDEAS */}
        <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
            From Stage 2
          </p>

          <h2 className="mt-2 text-3xl font-bold">Developed Products</h2>

          <p className="mt-3 max-w-3xl leading-relaxed text-black/60">
            Choose a developed idea when you are ready to start building it. The
            important product information carries forward automatically.
          </p>

          {developIdeas.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-black/20 bg-[#f5efe1] p-8 text-center">
              <p className="text-lg font-bold">No developed ideas yet.</p>

              <p className="mt-2 text-black/50">
                Finish a product in Stage 2 first.
              </p>

              <Link
                href="/research/develop-idea"
                className="mt-5 inline-block rounded-xl bg-[#7a1d1d] px-5 py-3 font-bold text-white"
              >
                Open Develop Idea →
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {developIdeas.map((idea) => {
                const alreadyBuilding = buildProjects.some(
                  (project) => project.sourceDevelopIdeaId === idea.id,
                );

                return (
                  <div
                    key={idea.id}
                    className="rounded-2xl border border-black/10 p-5"
                  >
                    <p className="text-xs font-bold uppercase text-[#7a1d1d]">
                      Developed Idea
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      {idea.productName}
                    </h3>

                    {idea.mainJob && (
                      <div className="mt-4 rounded-xl bg-[#f5efe1] p-4">
                        <p className="text-xs font-bold uppercase text-black/40">
                          One Main Job
                        </p>

                        <p className="mt-2 text-sm font-bold">{idea.mainJob}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => startBuildFromIdea(idea)}
                      className={`mt-5 rounded-xl px-5 py-3 text-sm font-bold ${
                        alreadyBuilding
                          ? "border border-black/15 bg-white"
                          : "bg-[#7a1d1d] text-white"
                      }`}
                    >
                      {alreadyBuilding
                        ? "Open Build Workspace →"
                        : "Start Building →"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SAVED BUILDS */}
        {buildProjects.length > 0 && (
          <div className="mt-8 rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
                  Active Builds
                </p>

                <h2 className="mt-2 text-3xl font-bold">Build Projects</h2>
              </div>

              <p className="text-sm font-bold text-black/40">
                {buildProjects.length}
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {buildProjects.map((project) => (
                <div
                  key={project.id}
                  className={`rounded-2xl border p-5 ${
                    selectedBuildId === project.id
                      ? "border-[#7a1d1d]"
                      : "border-black/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-[#7a1d1d]">
                        {project.status}
                      </p>

                      <h3 className="mt-2 text-xl font-bold">
                        {project.productName}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteBuildProject(project.id)}
                      className="text-sm font-bold text-black/35"
                    >
                      Delete
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedBuildId(project.id)}
                    className="mt-4 font-bold text-[#7a1d1d]"
                  >
                    Open Build →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedProject && (
          <>
            {/* PRODUCT SUMMARY */}
            <div className="mt-8 rounded-3xl border-2 border-[#7a1d1d] bg-white p-7 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
                Build Workspace
              </p>

              <h2 className="mt-2 text-4xl font-bold">
                {selectedProject.productName}
              </h2>

              <p className="mt-2 text-black/50">{selectedProject.industry}</p>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <SummaryCard label="Problem" value={selectedProject.problem} />

                <SummaryCard
                  label="Customer"
                  value={selectedProject.customer}
                />

                <SummaryCard
                  label="One Main Job"
                  value={selectedProject.mainJob}
                />

                <SummaryCard
                  label="Price Idea"
                  value={selectedProject.priceIdeas}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/research/develop-idea"
                  className="rounded-xl border border-black/15 px-5 py-3 text-sm font-bold"
                >
                  ← Back to Develop Idea
                </Link>
              </div>
            </div>

            {/* VERSION 1 */}
            <div className="mt-8 rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
                Section 1
              </p>

              <h2 className="mt-2 text-3xl font-bold">Version 1</h2>

              <p className="mt-3 max-w-3xl text-black/60">
                Keep the first build narrow. Build the smallest version that
                performs the main job safely and usefully.
              </p>

              <div className="mt-6">
                <TextArea
                  label="Version 1 Definition"
                  value={selectedProject.versionOne}
                  placeholder="What exactly must Version 1 do?"
                  onChange={(value) => updateProject("versionOne", value)}
                />
              </div>

              <div className="mt-5">
                <TextArea
                  label="Build Plan"
                  value={selectedProject.buildPlan}
                  placeholder="Break the Version 1 workflow into the order it needs to be built."
                  onChange={(value) => updateProject("buildPlan", value)}
                />
              </div>

              <div className="mt-5">
                <TextArea
                  label="Technical / Development Notes"
                  value={selectedProject.technicalNotes}
                  placeholder="Languages, frameworks, file structure, APIs, offline requirements, decisions, things to remember..."
                  onChange={(value) => updateProject("technicalNotes", value)}
                />
              </div>
            </div>

            {/* BUILD TASKS */}
            <div className="mt-8 rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
                    Section 2
                  </p>

                  <h2 className="mt-2 text-3xl font-bold">Build Checklist</h2>

                  <p className="mt-3 text-black/60">
                    Track the actual work required to get Version 1 running.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addBuildTask}
                  className="rounded-xl bg-[#333333] px-5 py-3 text-sm font-bold text-white"
                >
                  + Add Build Task
                </button>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>Build Progress</span>

                  <span className="text-[#7a1d1d]">{buildProgress}%</span>
                </div>

                <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[#7a1d1d] transition-all"
                    style={{
                      width: `${buildProgress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {selectedProject.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 rounded-2xl bg-[#f5efe1] p-4"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleBuildTask(task.id)}
                      className="h-5 w-5"
                    />

                    <p
                      className={`flex-1 font-bold ${
                        task.completed ? "text-black/35 line-through" : ""
                      }`}
                    >
                      {task.title}
                    </p>

                    <button
                      type="button"
                      onClick={() => deleteBuildTask(task.id)}
                      className="text-sm font-bold text-black/30"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* TEST */}
            <div className="mt-8 rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
                Section 3
              </p>

              <h2 className="mt-2 text-3xl font-bold">Test Version 1</h2>

              <p className="mt-3 max-w-3xl text-black/60">
                Test the real workflow instead of only testing whether
                individual buttons work.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <TextArea
                  label="Test Notes"
                  value={selectedProject.testNotes}
                  placeholder="What did you test? What happened?"
                  onChange={(value) => updateProject("testNotes", value)}
                />

                <TextArea
                  label="Problems Found"
                  value={selectedProject.issuesFound}
                  placeholder="Bugs, confusing steps, slow areas, unsafe behavior, missing pieces..."
                  onChange={(value) => updateProject("issuesFound", value)}
                />
              </div>

              <div className="mt-5">
                <TextArea
                  label="Fixes Needed"
                  value={selectedProject.fixesNeeded}
                  placeholder="What must be fixed before Version 1 is ready?"
                  onChange={(value) => updateProject("fixesNeeded", value)}
                />
              </div>
            </div>

            {/* RELEASE */}
            <div className="mt-8 rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
                Section 4
              </p>

              <h2 className="mt-2 text-3xl font-bold">Release Readiness</h2>

              <p className="mt-3 max-w-3xl text-black/60">
                A product is not finished just because the code runs. Check the
                things required to actually put it in front of buyers.
              </p>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>Release Progress</span>

                  <span className="text-[#7a1d1d]">{launchProgress}%</span>
                </div>

                <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[#7a1d1d] transition-all"
                    style={{
                      width: `${launchProgress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {selectedProject.launchChecklist.map((task) => (
                  <label
                    key={task.id}
                    className="flex cursor-pointer items-center gap-4 rounded-2xl bg-[#f5efe1] p-4"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleLaunchTask(task.id)}
                      className="h-5 w-5"
                    />

                    <span
                      className={`font-bold ${
                        task.completed ? "text-black/35 line-through" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-6">
                <TextArea
                  label="Release Notes"
                  value={selectedProject.releaseNotes}
                  placeholder="Version number, launch notes, known limitations, what comes after Version 1..."
                  onChange={(value) => updateProject("releaseNotes", value)}
                />
              </div>
            </div>

            {/* FINISH */}
            <div className="mt-8 rounded-3xl bg-[#333333] p-7 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d8d4cb]">
                Finish Line
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {selectedProject.status === "Ready for Release"
                  ? "Product Ready for Release"
                  : "Finish Version 1"}
              </h2>

              <p className="mt-3 max-w-3xl leading-relaxed text-[#d8d4cb]">
                The goal is not endless feature building. Get the one important
                job working well, test it, fix the major issues, and put Version
                1 in front of real users.
              </p>

              <button
                type="button"
                onClick={markReadyForRelease}
                className="mt-6 rounded-xl bg-white px-6 py-3 font-bold text-[#1a1a1a]"
              >
                Mark Ready for Release ✓
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
};

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-2xl bg-[#f5efe1] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-black/40">
        {label}
      </p>

      <p className="mt-2 leading-relaxed">{value || "Not defined yet."}</p>
    </div>
  );
}

type TextAreaProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

function TextArea({ label, value, placeholder, onChange }: TextAreaProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold">{label}</label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full resize-y rounded-2xl border border-black/15 bg-white px-4 py-4 outline-none transition focus:border-[#7a1d1d]"
      />
    </div>
  );
}
