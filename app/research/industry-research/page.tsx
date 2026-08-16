"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ResearchQuestion = {
  id: string;
  category: string;
  question: string;
  answer: string;
  isCustom: boolean;
};

type IndustryProject = {
  id: number;
  industry: string;
  focus: string;
  createdAt: string;
  questions: ResearchQuestion[];
};

const STORAGE_KEY = "plantthevegan-industry-research-projects";

function makeQuestionId(index: number) {
  return `question-${Date.now()}-${index}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function createDefaultQuestions(
  industry: string,
  focus: string,
): ResearchQuestion[] {
  const focusContext = focus.trim()
    ? ` Pay special attention to this starting focus: "${focus.trim()}".`
    : "";

  const questions = [
    {
      category: "Market Map",
      question: `Explain the ${industry} industry in plain English. Break down the major types of businesses, workers, customers, services, products, and smaller niches inside this industry.${focusContext}`,
    },
    {
      category: "Buyers",
      question: `Who spends money in the ${industry} industry? Identify the main buyers, what they already pay for, what they consider important, and which buyers are most likely to pay for software or small digital tools.${focusContext}`,
    },
    {
      category: "Workflow",
      question: `Walk through the normal day-to-day workflows inside the ${industry} industry. Show the major jobs people repeatedly perform from beginning to end.${focusContext}`,
    },
    {
      category: "Software & Tools",
      question: `What software, apps, websites, equipment, spreadsheets, and other tools are commonly used in the ${industry} industry? Explain what each one is used for.${focusContext}`,
    },
    {
      category: "Manual Work",
      question: `What work in the ${industry} industry is still being done manually, repeatedly, with spreadsheets, text messages, paper, memory, or workarounds? Focus on tasks that waste time or cause mistakes.${focusContext}`,
    },
    {
      category: "Complaints",
      question: `What do people working in the ${industry} industry commonly complain about? Look for frustrating software, repetitive tasks, expensive services, confusing processes, missing features, errors, delays, and workarounds.${focusContext}`,
    },
    {
      category: "Weak Software",
      question: `What existing software or digital tools used in the ${industry} industry have weak, complicated, expensive, or missing features? Identify specific jobs users still struggle to complete.${focusContext}`,
    },
    {
      category: "Repeated Jobs",
      question: `What small jobs are performed over and over again in the ${industry} industry? Break large workflows into small individual jobs that could potentially become one-purpose digital tools.${focusContext}`,
    },
    {
      category: "Money",
      question: `Where is money already being spent to solve problems in the ${industry} industry? Include software subscriptions, contractors, employees, outsourced services, consultants, equipment, and inefficient workarounds.${focusContext}`,
    },
    {
      category: "Opportunity",
      question: `Based on the ${industry} industry, identify small software or digital-tool opportunities where one focused product could solve one painful job very well. Do not give giant all-in-one platform ideas. Explain the problem, who has it, how they solve it now, and why a small tool could be valuable.${focusContext}`,
    },
  ];

  return questions.map((item, index) => ({
    id: makeQuestionId(index),
    category: item.category,
    question: item.question,
    answer: "",
    isCustom: false,
  }));
}

export default function IndustryResearchPage() {
  const [industry, setIndustry] = useState("");
  const [focus, setFocus] = useState("");
  const [projects, setProjects] = useState<IndustryProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const [isStarting, setIsStarting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  const canCreate = useMemo(() => {
    return industry.trim().length > 0 && !isStarting;
  }, [industry, isStarting]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as IndustryProject[];

        if (Array.isArray(parsed)) {
          const migratedProjects = parsed.map((project) => ({
            ...project,
            questions:
              Array.isArray(project.questions) && project.questions.length > 0
                ? project.questions
                : createDefaultQuestions(
                    project.industry || "this industry",
                    project.focus || "",
                  ),
          }));

          setProjects(migratedProjects);
        }
      }
    } catch (error) {
      console.error("Could not load industry research projects:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    if (isLoadingProjects) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error("Could not save industry research projects:", error);
    }
  }, [projects, isLoadingProjects]);

  function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function createProject() {
    if (!canCreate) return;

    const cleanIndustry = industry.trim();
    const cleanFocus = focus.trim();

    setIsStarting(true);
    setProgress(10);
    setProgressText("Creating research project...");

    await wait(300);

    setProgress(30);
    setProgressText("Setting up industry research...");

    await wait(350);

    setProgress(55);
    setProgressText("Preparing market questions...");

    await wait(350);

    setProgress(75);
    setProgressText("Preparing problem discovery...");

    await wait(350);

    setProgress(90);
    setProgressText("Saving project...");

    await wait(300);

    const newProject: IndustryProject = {
      id: Date.now(),
      industry: cleanIndustry,
      focus: cleanFocus,
      createdAt: new Date().toLocaleDateString(),
      questions: createDefaultQuestions(cleanIndustry, cleanFocus),
    };

    setProjects((current) => [newProject, ...current]);

    setProgress(100);
    setProgressText("Research project ready.");

    await wait(400);

    setIndustry("");
    setFocus("");
    setIsStarting(false);
    setProgress(0);
    setProgressText("");
  }

  function deleteProject(projectId: number) {
    const confirmed = window.confirm("Delete this industry research project?");

    if (!confirmed) return;

    setProjects((current) =>
      current.filter((project) => project.id !== projectId),
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
            Stage 1
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
            Industry Research
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#d8d4cb]">
            Start broad. Pick an industry, understand how the market works,
            uncover problems, then narrow everything down into small product
            opportunities.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        {/* FLOW */}
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
            Research Flow
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-[#f5efe1] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7a1d1d] font-bold text-white">
                1
              </div>

              <h2 className="mt-4 text-lg font-bold">Pick Industry</h2>

              <p className="mt-2 text-sm leading-relaxed text-black/60">
                Choose the market you want to investigate.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f5efe1] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#333333] font-bold text-white">
                2
              </div>

              <h2 className="mt-4 text-lg font-bold">Understand Market</h2>

              <p className="mt-2 text-sm leading-relaxed text-black/60">
                Ask the right questions and save the research inside the
                project.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f5efe1] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#333333] font-bold text-white">
                3
              </div>

              <h2 className="mt-4 text-lg font-bold">Find Problems</h2>

              <p className="mt-2 text-sm leading-relaxed text-black/60">
                Look for complaints, repetitive work, weak software, and
                expensive workarounds.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f5efe1] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#333333] font-bold text-white">
                4
              </div>

              <h2 className="mt-4 text-lg font-bold">Generate Ideas</h2>

              <p className="mt-2 text-sm leading-relaxed text-black/60">
                Turn the strongest problems into focused one-job product ideas.
              </p>
            </div>
          </div>
        </div>

        {/* START PROJECT */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
              Start Here
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              What industry do you want to research?
            </h2>

            <p className="mt-3 max-w-2xl leading-relaxed text-black/60">
              Keep this broad at first. You can narrow the market down after you
              understand what is happening inside it.
            </p>

            <div className="mt-7">
              <label
                htmlFor="industry"
                className="mb-2 block text-sm font-bold"
              >
                Industry
              </label>

              <input
                id="industry"
                value={industry}
                disabled={isStarting}
                onChange={(event) => setIndustry(event.target.value)}
                placeholder="Example: DJs, auto repair shops, trucking, restaurants..."
                className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-base outline-none transition focus:border-[#7a1d1d] disabled:bg-black/5"
              />
            </div>

            <div className="mt-5">
              <label htmlFor="focus" className="mb-2 block text-sm font-bold">
                Anything specific you already want to look into?
              </label>

              <textarea
                id="focus"
                value={focus}
                disabled={isStarting}
                onChange={(event) => setFocus(event.target.value)}
                placeholder="Optional. Example: software DJs use to organize large music libraries."
                rows={5}
                className="w-full resize-none rounded-2xl border border-black/15 bg-white px-4 py-4 text-base outline-none transition focus:border-[#7a1d1d] disabled:bg-black/5"
              />
            </div>

            <button
              type="button"
              onClick={createProject}
              disabled={!canCreate}
              className="mt-6 rounded-xl bg-[#7a1d1d] px-6 py-3 font-bold text-white transition hover:bg-[#681919] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isStarting
                ? "Starting Research..."
                : "Start Industry Research →"}
            </button>

            {isStarting && (
              <div className="mt-6 rounded-2xl border border-black/10 bg-[#f5efe1] p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold">{progressText}</p>

                  <p className="text-sm font-bold text-[#7a1d1d]">
                    {progress}%
                  </p>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[#7a1d1d] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* WHAT WE ARE LOOKING FOR */}
          <div className="rounded-3xl bg-[#333333] p-7 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d8d4cb]">
              What We Are Looking For
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Find where the opportunity is hiding.
            </h2>

            <div className="mt-6 space-y-3">
              {[
                "Who works in this industry?",
                "Who spends money in this market?",
                "What software and tools do they already use?",
                "What work do they still do manually?",
                "What do people complain about?",
                "What software features are weak or missing?",
                "What jobs repeat over and over?",
                "What tasks could become small digital products?",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <p className="text-sm font-medium text-[#f5efe1]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SAVED PROJECTS */}
        <div className="mt-10">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
                Saved Research
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Industry Research Projects
              </h2>
            </div>

            <p className="text-sm font-bold text-black/50">
              {isLoadingProjects
                ? "Loading..."
                : `${projects.length} ${
                    projects.length === 1 ? "project" : "projects"
                  }`}
            </p>
          </div>

          {isLoadingProjects ? (
            <div className="mt-6 rounded-3xl border border-black/10 bg-white p-8">
              <p className="font-bold">Loading saved projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-black/20 bg-white/50 p-10 text-center">
              <p className="text-xl font-bold">No research projects yet.</p>

              <p className="mt-2 text-black/55">
                Enter an industry above and start your first research project.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
                        Industry
                      </p>

                      <h3 className="mt-2 text-2xl font-bold">
                        {project.industry}
                      </h3>
                    </div>

                    <span className="rounded-full bg-[#f5efe1] px-3 py-1 text-xs font-bold text-black/50">
                      {project.createdAt}
                    </span>
                  </div>

                  {project.focus && (
                    <div className="mt-5 rounded-2xl bg-[#f5efe1] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-black/45">
                        Starting Focus
                      </p>

                      <p className="mt-2 text-sm leading-relaxed text-black/65">
                        {project.focus}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-3">
                    <span className="rounded-full bg-[#333333] px-3 py-1 text-xs font-bold text-white">
                      {project.questions.length} research questions
                    </span>

                    <span className="rounded-full bg-[#f5efe1] px-3 py-1 text-xs font-bold text-black/50">
                      {
                        project.questions.filter(
                          (question) => question.answer.trim().length > 0,
                        ).length
                      }{" "}
                      answered
                    </span>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <Link
                      href={`/research/industry-research/${project.id}`}
                      className="font-bold text-[#7a1d1d]"
                    >
                      Continue Research →
                    </Link>

                    <button
                      type="button"
                      onClick={() => deleteProject(project.id)}
                      className="text-sm font-bold text-black/40 transition hover:text-[#7a1d1d]"
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
