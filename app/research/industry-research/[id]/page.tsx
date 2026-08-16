"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ResearchQuestion = {
  id: string;
  category: string;
  question: string;
  answer: string;
  isCustom: boolean;
};

type ProblemScores = {
  frequency: number;
  pain: number;
  spending: number;
  moneyAroundProblem: number;
  solutionWeakness: number;
  buildability: number;
  payLikelihood: number;
};

type DemandTrend = {
  days30: string;
  days90: string;
  months6: string;
  months12: string;
  trend: "Growing" | "Stable" | "Falling" | "Unknown";
  source: string;
  notes: string;
};

type OpportunityEvidence = {
  problemTrend: "Growing" | "Stable" | "Falling" | "Unknown";
  buyerType: string;
  currentSolutionSpend: string;
  solutionFrustration: "High" | "Medium" | "Low" | "Unknown";
  switchingDifficulty: "Low" | "Medium" | "High" | "Unknown";
  reachability: "Easy" | "Medium" | "Hard" | "Unknown";
  diyWorkarounds: "Found" | "Some" | "None" | "Unknown";
  jobFrequency: string;
  costOfDoingNothing: string;
  smallestSellableJob: string;
  evidenceSummary: string;
};

type ResearchProblem = {
  id: string;
  title: string;
  description: string;
  whoHasProblem: string;
  evidence: string;
  currentSolution: string;
  whyItMatters: string;
  sourceCategory: string;
  isManual: boolean;
  scores: ProblemScores;
  scoreReason: string;
  demandTrend: DemandTrend;
  opportunityEvidence: OpportunityEvidence;
};

type ProductIdea = {
  id: string;
  title: string;
  problemId: string;
  problemTitle: string;
  targetUser: string;
  oneJob: string;
  currentWorkaround: string;
  whyUseful: string;
  versionOne: string;
  pricingThought: string;
  notes: string;
  isManual: boolean;
};

type IndustryProject = {
  id: number;
  industry: string;
  focus: string;
  createdAt: string;
  questions?: ResearchQuestion[];
  fullResearchResult?: string;
  problems?: ResearchProblem[];
  ideas?: ProductIdea[];
  winnerIdeaId?: string;
};

type DevelopIdeaProject = {
  id: number;
  sourceIndustryProjectId: number;
  sourceIdeaId: string;
  industry: string;
  productName: string;
  targetUser: string;
  problem: string;
  oneJob: string;
  currentWorkaround: string;
  whyUseful: string;
  versionOne: string;
  pricingThought: string;
  notes: string;
  createdAt: string;
  status: string;
};

const STORAGE_KEY = "plantthevegan-industry-research-projects";

const DEVELOP_IDEA_STORAGE_KEY = "plantthevegan-develop-idea-projects";

const EMPTY_DEMAND_TREND: DemandTrend = {
  days30: "",
  days90: "",
  months6: "",
  months12: "",
  trend: "Unknown",
  source: "",
  notes: "",
};

const EMPTY_OPPORTUNITY_EVIDENCE: OpportunityEvidence = {
  problemTrend: "Unknown",
  buyerType: "",
  currentSolutionSpend: "",
  solutionFrustration: "Unknown",
  switchingDifficulty: "Unknown",
  reachability: "Unknown",
  diyWorkarounds: "Unknown",
  jobFrequency: "",
  costOfDoingNothing: "",
  smallestSellableJob: "",
  evidenceSummary: "",
};

const EMPTY_SCORES: ProblemScores = {
  frequency: 0,
  pain: 0,
  spending: 0,
  moneyAroundProblem: 0,
  solutionWeakness: 0,
  buildability: 0,
  payLikelihood: 0,
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTotalScore(scores: ProblemScores) {
  return (
    scores.frequency +
    scores.pain +
    scores.spending +
    scores.moneyAroundProblem +
    scores.solutionWeakness +
    scores.buildability +
    scores.payLikelihood
  );
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
      question: `Based on the ${industry} industry, identify small software or digital-tool opportunities where one focused product could solve one painful job very well. Do not give giant all-in-one platform ideas.${focusContext}`,
    },
  ];

  return questions.map((item) => ({
    id: makeId("question"),
    category: item.category,
    question: item.question,
    answer: "",
    isCustom: false,
  }));
}

export default function IndustryResearchWorkspacePage() {
  const params = useParams();
  const projectId = Number(params.id);

  const [project, setProject] = useState<IndustryProject | null>(null);
  const [loading, setLoading] = useState(true);

  const [showResearchQuestionsSection, setShowResearchQuestionsSection] =
    useState(false);

  const [showFindProblemsSection, setShowFindProblemsSection] = useState(false);

  const [showRankOpportunitiesSection, setShowRankOpportunitiesSection] =
    useState(false);

  const [showGenerateIdeasSection, setShowGenerateIdeasSection] =
    useState(false);

  // STEP 1
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [copiedFullPrompt, setCopiedFullPrompt] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newCategory, setNewCategory] = useState("Custom Research");
  const [newQuestion, setNewQuestion] = useState("");

  // STEP 2
  const [copiedProblemPrompt, setCopiedProblemPrompt] = useState(false);
  const [copiedAllProblems, setCopiedAllProblems] = useState(false);
  const [problemImportText, setProblemImportText] = useState("");
  const [problemImportMessage, setProblemImportMessage] = useState("");
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [manualProblemTitle, setManualProblemTitle] = useState("");
  const [manualProblemDescription, setManualProblemDescription] = useState("");
  const [manualProblemWho, setManualProblemWho] = useState("");
  const [manualProblemEvidence, setManualProblemEvidence] = useState("");

  // STEP 3
  const [copiedScorePrompt, setCopiedScorePrompt] = useState(false);
  const [scoreImportText, setScoreImportText] = useState("");
  const [scoreImportMessage, setScoreImportMessage] = useState("");

  const [copiedDemandPrompt, setCopiedDemandPrompt] = useState(false);
  const [demandImportText, setDemandImportText] = useState("");
  const [demandImportMessage, setDemandImportMessage] = useState("");

  const [copiedEvidencePrompt, setCopiedEvidencePrompt] = useState(false);
  const [showRankedResults, setShowRankedResults] = useState(true);
  const [copiedRankedResults, setCopiedRankedResults] = useState(false);
  const [openRankedProblemId, setOpenRankedProblemId] = useState<string | null>(
    null,
  );
  const [evidenceImportText, setEvidenceImportText] = useState("");
  const [evidenceImportMessage, setEvidenceImportMessage] = useState("");

  // STEP 4
  const [copiedIdeaPrompt, setCopiedIdeaPrompt] = useState(false);
  const [ideaImportText, setIdeaImportText] = useState("");
  const [ideaImportMessage, setIdeaImportMessage] = useState("");
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [manualIdeaTitle, setManualIdeaTitle] = useState("");
  const [manualIdeaProblemId, setManualIdeaProblemId] = useState("");
  const [manualIdeaUser, setManualIdeaUser] = useState("");
  const [manualIdeaJob, setManualIdeaJob] = useState("");
  const [moveMessage, setMoveMessage] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setLoading(false);
        return;
      }

      const projects = JSON.parse(saved) as IndustryProject[];

      const foundProject = projects.find((item) => item.id === projectId);

      if (!foundProject) {
        setProject(null);
        return;
      }

      const migratedProblems = Array.isArray(foundProject.problems)
        ? foundProject.problems.map((problem) => ({
            ...problem,
            scores: {
              ...EMPTY_SCORES,
              ...(problem.scores || {}),
            },
            scoreReason: problem.scoreReason || "",
            demandTrend: {
              ...EMPTY_DEMAND_TREND,
              ...(problem.demandTrend || {}),
            },
            opportunityEvidence: {
              ...EMPTY_OPPORTUNITY_EVIDENCE,
              ...(problem.opportunityEvidence || {}),
            },
          }))
        : [];

      const preparedProject: IndustryProject = {
        ...foundProject,

        questions:
          Array.isArray(foundProject.questions) &&
          foundProject.questions.length > 0
            ? foundProject.questions
            : createDefaultQuestions(
                foundProject.industry,
                foundProject.focus || "",
              ),

        fullResearchResult: foundProject.fullResearchResult || "",

        problems: migratedProblems,

        ideas: Array.isArray(foundProject.ideas) ? foundProject.ideas : [],

        winnerIdeaId: foundProject.winnerIdeaId || "",
      };

      setProject(preparedProject);

      const updatedProjects = projects.map((item) =>
        item.id === projectId ? preparedProject : item,
      );

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    } catch (error) {
      console.error("Could not load research project:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const questions = project?.questions || [];
  const problems = project?.problems || [];
  const ideas = project?.ideas || [];

  const answeredQuestions = useMemo(() => {
    return questions.filter((question) => question.answer.trim().length > 0);
  }, [questions]);

  const answeredCount = answeredQuestions.length;

  const completionPercent = useMemo(() => {
    if (questions.length === 0) return 0;

    return Math.round((answeredCount / questions.length) * 100);
  }, [answeredCount, questions.length]);

  const hasFullResearch = Boolean(project?.fullResearchResult?.trim());

  const hasResearchForProblems =
    hasFullResearch || answeredQuestions.length > 0;

  const rankedProblems = useMemo(() => {
    return [...problems].sort(
      (a, b) => getTotalScore(b.scores) - getTotalScore(a.scores),
    );
  }, [problems]);

  const scoredProblemsCount = useMemo(() => {
    return problems.filter((problem) => getTotalScore(problem.scores) > 0)
      .length;
  }, [problems]);

  const winnerIdea = useMemo(() => {
    if (!project?.winnerIdeaId) return null;

    return ideas.find((idea) => idea.id === project.winnerIdeaId) || null;
  }, [ideas, project?.winnerIdeaId]);

  function saveProject(updatedProject: IndustryProject) {
    setProject(updatedProject);

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (!saved) return;

      const projects = JSON.parse(saved) as IndustryProject[];

      const updatedProjects = projects.map((item) =>
        item.id === updatedProject.id ? updatedProject : item,
      );

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    } catch (error) {
      console.error("Could not save research project:", error);
    }
  }

  async function copyText(text: string, successAction: () => void) {
    try {
      await navigator.clipboard.writeText(text);
      successAction();
    } catch (error) {
      console.error("Could not copy text:", error);
    }
  }

  function cleanJsonText(text: string) {
    return text
      .trim()
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();
  }

  // =========================================================
  // STEP 1
  // =========================================================

  function updateAnswer(questionId: string, answer: string) {
    if (!project) return;

    saveProject({
      ...project,

      questions: questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              answer,
            }
          : question,
      ),
    });
  }

  function updateFullResearchResult(value: string) {
    if (!project) return;

    saveProject({
      ...project,
      fullResearchResult: value,
    });
  }

  function updateQuestionText(questionId: string, text: string) {
    if (!project) return;

    saveProject({
      ...project,

      questions: questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              question: text,
            }
          : question,
      ),
    });
  }

  function updateQuestionCategory(questionId: string, category: string) {
    if (!project) return;

    saveProject({
      ...project,

      questions: questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              category,
            }
          : question,
      ),
    });
  }

  async function copyQuestion(question: ResearchQuestion) {
    if (!project) return;

    const prompt = `I am researching the ${project.industry} industry.

${
  project.focus
    ? `My current starting focus is:
${project.focus}

`
    : ""
}RESEARCH QUESTION:

${question.question}

Please give me a detailed but practical research answer.

I am looking for information that can help me discover small software or digital-product opportunities.

Separate facts from assumptions.

When possible explain:

- who has the problem
- how often it happens
- how people handle it now
- what software or tools are involved
- what people complain about
- what work is still manual
- where money is already being spent
- what evidence needs more research

Do not force a product idea yet.

I am trying to understand the market first.`;

    await copyText(prompt, () => {
      setCopiedQuestionId(question.id);

      window.setTimeout(() => {
        setCopiedQuestionId(null);
      }, 1800);
    });
  }

  async function copyFullResearchPrompt() {
    if (!project) return;

    const prompt = `I am researching the ${project.industry} industry to discover small software and digital-product opportunities.

${
  project.focus
    ? `STARTING FOCUS:

${project.focus}

`
    : ""
}I do not want giant all-in-one startup ideas yet.

Help me understand this industry deeply enough to find real problems, repetitive jobs, expensive workarounds, weak software, and places where people already spend money.

ANSWER THESE QUESTIONS:

${questions
  .map(
    (question, index) => `${index + 1}. ${question.category}

${question.question}`,
  )
  .join("\n\n")}

IMPORTANT:

- Keep each answer separate.
- Use plain English.
- Separate facts from assumptions.
- Identify real workflows.
- Identify existing software.
- Identify manual work.
- Identify complaints.
- Identify where money is spent.
- Do not jump straight to a giant product idea.`;

    await copyText(prompt, () => {
      setCopiedFullPrompt(true);

      window.setTimeout(() => {
        setCopiedFullPrompt(false);
      }, 1800);
    });
  }

  function addCustomQuestion() {
    if (!project || !newQuestion.trim()) return;

    const customQuestion: ResearchQuestion = {
      id: makeId("question"),
      category: newCategory.trim() || "Custom Research",
      question: newQuestion.trim(),
      answer: "",
      isCustom: true,
    };

    saveProject({
      ...project,
      questions: [...questions, customQuestion],
    });

    setNewCategory("Custom Research");
    setNewQuestion("");
    setShowAddQuestion(false);
    setOpenQuestionId(customQuestion.id);
  }

  function deleteQuestion(questionId: string) {
    if (!project) return;

    const question = questions.find((item) => item.id === questionId);

    if (!question) return;

    const confirmed = window.confirm(
      `Remove this research question?\n\n${question.question}`,
    );

    if (!confirmed) return;

    saveProject({
      ...project,

      questions: questions.filter((item) => item.id !== questionId),
    });
  }

  // =========================================================
  // STEP 2
  // =========================================================

  async function copyProblemFindingPrompt() {
    if (!project || !hasResearchForProblems) return;

    let savedResearch = "";

    if (project.fullResearchResult?.trim()) {
      savedResearch = `FULL RESEARCH RESULT:

${project.fullResearchResult.trim()}`;
    } else {
      savedResearch = answeredQuestions
        .map(
          (question, index) => `RESEARCH SECTION ${index + 1}

CATEGORY:
${question.category}

QUESTION:
${question.question}

ANSWER:
${question.answer}`,
        )
        .join("\n\n----------------------------------------\n\n");
    }

    const prompt = `I am researching the ${project.industry} industry.

I already completed market research.

Your job is NOT to give me random startup ideas.

Extract specific problems that could eventually become small focused digital products.

SAVED RESEARCH:

${savedResearch}

LOOK FOR:

- repeated manual work
- repetitive administrative work
- common complaints
- confusing workflows
- software frustrations
- missing features
- duplicate work
- errors
- expensive workarounds
- time-consuming jobs
- constant information searching
- spreadsheet workflows
- paper workflows
- text-message workflows
- memory-based workflows
- jobs requiring several apps

RULES:

1. Keep problems narrow.
2. Do not invent evidence.
3. Separate different problems.
4. Merge true duplicates.
5. Do not create products yet.
6. Strongest problems first.
7. Only use problems supported by the saved research.
8. If something is only a hypothesis or needs deeper verification, make that clear in the evidence field.

RETURN ONLY JSON.

Use:

[
  {
    "title": "Problem name",
    "description": "Explanation",
    "whoHasProblem": "Who has it",
    "evidence": "Evidence",
    "currentSolution": "How it is handled now",
    "whyItMatters": "Why it matters",
    "sourceCategory": "Research category"
  }
]`;

    await copyText(prompt, () => {
      setCopiedProblemPrompt(true);

      window.setTimeout(() => {
        setCopiedProblemPrompt(false);
      }, 1800);
    });
  }

  function importProblems() {
    if (!project) return;

    setProblemImportMessage("");

    try {
      const parsed = JSON.parse(cleanJsonText(problemImportText)) as Array<{
        title?: string;
        description?: string;
        whoHasProblem?: string;
        evidence?: string;
        currentSolution?: string;
        whyItMatters?: string;
        sourceCategory?: string;
      }>;

      if (!Array.isArray(parsed)) {
        setProblemImportMessage("The pasted result is not a problem list.");
        return;
      }

      const imported: ResearchProblem[] = parsed
        .filter((item) => typeof item.title === "string" && item.title.trim())
        .map((item) => ({
          id: makeId("problem"),
          title: item.title?.trim() || "",
          description: item.description?.trim() || "",
          whoHasProblem: item.whoHasProblem?.trim() || "",
          evidence: item.evidence?.trim() || "",
          currentSolution: item.currentSolution?.trim() || "",
          whyItMatters: item.whyItMatters?.trim() || "",
          sourceCategory: item.sourceCategory?.trim() || "",
          isManual: false,
          scores: { ...EMPTY_SCORES },
          scoreReason: "",
          demandTrend: { ...EMPTY_DEMAND_TREND },
          opportunityEvidence: { ...EMPTY_OPPORTUNITY_EVIDENCE },
        }));

      if (imported.length === 0) {
        setProblemImportMessage("No usable problems were found.");
        return;
      }

      saveProject({
        ...project,
        problems: [...problems, ...imported],
      });

      setProblemImportText("");

      setProblemImportMessage(`${imported.length} problems imported.`);
    } catch (error) {
      console.error(error);

      setProblemImportMessage(
        "Could not read that result. Paste the complete JSON answer.",
      );
    }
  }

  async function copyAllProblems() {
    if (!project || problems.length === 0) return;

    const text = problems
      .map(
        (problem, index) => `PROBLEM ${index + 1}

TITLE:
${problem.title}

DESCRIPTION:
${problem.description}

WHO HAS THE PROBLEM:
${problem.whoHasProblem}

EVIDENCE:
${problem.evidence}

CURRENT SOLUTION:
${problem.currentSolution}

WHY IT MATTERS:
${problem.whyItMatters}

SOURCE CATEGORY:
${problem.sourceCategory}`,
      )
      .join("\n\n----------------------------------------\n\n");

    await copyText(text, () => {
      setCopiedAllProblems(true);

      window.setTimeout(() => {
        setCopiedAllProblems(false);
      }, 1800);
    });
  }

  function addManualProblem() {
    if (!project || !manualProblemTitle.trim()) return;

    const newProblem: ResearchProblem = {
      id: makeId("problem"),
      title: manualProblemTitle.trim(),
      description: manualProblemDescription.trim(),
      whoHasProblem: manualProblemWho.trim(),
      evidence: manualProblemEvidence.trim(),
      currentSolution: "",
      whyItMatters: "",
      sourceCategory: "Manual Entry",
      isManual: true,
      scores: { ...EMPTY_SCORES },
      scoreReason: "",
      demandTrend: { ...EMPTY_DEMAND_TREND },
      opportunityEvidence: { ...EMPTY_OPPORTUNITY_EVIDENCE },
    };

    saveProject({
      ...project,
      problems: [...problems, newProblem],
    });

    setManualProblemTitle("");
    setManualProblemDescription("");
    setManualProblemWho("");
    setManualProblemEvidence("");
    setShowAddProblem(false);
  }

  function deleteProblem(problemId: string) {
    if (!project) return;

    if (!window.confirm("Delete this problem?")) return;

    saveProject({
      ...project,

      problems: problems.filter((problem) => problem.id !== problemId),

      ideas: ideas.filter((idea) => idea.problemId !== problemId),
    });
  }

  function deleteAllProblems() {
    if (!project) return;

    if (!window.confirm("Delete all problems and generated ideas?")) return;

    saveProject({
      ...project,
      problems: [],
      ideas: [],
      winnerIdeaId: "",
    });
  }

  // =========================================================
  // STEP 3
  // =========================================================

  function updateProblemScore(
    problemId: string,
    key: keyof ProblemScores,
    value: number,
  ) {
    if (!project) return;

    saveProject({
      ...project,

      problems: problems.map((problem) =>
        problem.id === problemId
          ? {
              ...problem,

              scores: {
                ...problem.scores,
                [key]: value,
              },
            }
          : problem,
      ),
    });
  }

  async function copyScoringPrompt() {
    if (!project || problems.length === 0) return;

    const data = problems
      .map(
        (problem, index) => `PROBLEM ${index + 1}

ID:
${problem.id}

TITLE:
${problem.title}

DESCRIPTION:
${problem.description}

WHO:
${problem.whoHasProblem}

EVIDENCE:
${problem.evidence}

CURRENT SOLUTION:
${problem.currentSolution}

WHY IT MATTERS:
${problem.whyItMatters}`,
      )
      .join("\n\n----------------------------------------\n\n");

    const prompt = `Score these problems as SMALL single-purpose product opportunities inside the ${project.industry} industry.

SCORE EACH 1 THROUGH 5:

frequency
pain
spending
moneyAroundProblem
solutionWeakness
buildability
payLikelihood

MONEY AROUND THE PROBLEM:

1 = very price-sensitive customers and little money moving around this problem
2 = some spending exists, but budgets are limited
3 = normal professional or small-business spending
4 = substantial business money, expensive labor, valuable transactions, or meaningful financial consequences
5 = investors, high-value businesses, large transactions, expensive assets, or workflows where mistakes, delays, or saved time can be worth thousands of dollars or more

IMPORTANT:

Do not confuse spending with moneyAroundProblem.

spending = are people already paying to solve this specific problem?

moneyAroundProblem = how much money is flowing through the larger customer/workflow where this problem occurs?

Be conservative.

Do not reward something just because it sounds exciting.

Use the evidence provided.

PROBLEMS:

${data}

RETURN ONLY JSON:

[
  {
    "id": "exact problem ID",
    "frequency": 1,
    "pain": 1,
    "spending": 1,
    "moneyAroundProblem": 1,
    "solutionWeakness": 1,
    "buildability": 1,
    "payLikelihood": 1,
    "reason": "Short reason"
  }
]`;

    await copyText(prompt, () => {
      setCopiedScorePrompt(true);

      window.setTimeout(() => {
        setCopiedScorePrompt(false);
      }, 1800);
    });
  }

  async function copyDemandTrendPrompt() {
    if (!project || problems.length === 0) return;

    const data = problems
      .map(
        (problem, index) => `PROBLEM ${index + 1}

ID:
${problem.id}

TITLE:
${problem.title}

DESCRIPTION:
${problem.description}

WHO HAS IT:
${problem.whoHasProblem}

CURRENT SOLUTION:
${problem.currentSolution}`,
      )
      .join("\n\n----------------------------------------\n\n");

    const prompt = `Research CURRENT SEARCH DEMAND for these problems inside the ${project.industry} industry.

I am trying to see whether people are actively researching these problems now, whether attention is growing or shrinking, and whether the demand has lasted long enough to matter.

FOR EACH PROBLEM, CHECK:

- approximate search interest or search volume over the past 30 days
- approximate search interest or search volume over the past 90 days
- approximate search interest or search volume over the past 6 months
- approximate search interest or search volume over the past 12 months
- whether the overall trend is Growing, Stable, Falling, or Unknown

IMPORTANT RULES:

1. Use current web/search-trend evidence when available.
2. Do NOT invent exact search numbers.
3. If only a range or relative trend is available, use that instead.
4. If exact volume cannot be verified, say "Unknown".
5. Distinguish search demand from complaints. A niche business problem can still be valuable with low public search volume.
6. Prefer evidence from Google Trends, keyword/search tools, search-result activity, forums, communities, or other credible demand signals.
7. Keep the exact problem ID so I can import the result into my research app.

PROBLEMS:

${data}

RETURN ONLY JSON:

[
  {
    "id": "exact problem ID",
    "days30": "search volume, range, relative interest, or Unknown",
    "days90": "search volume, range, relative interest, or Unknown",
    "months6": "search volume, range, relative interest, or Unknown",
    "months12": "search volume, range, relative interest, or Unknown",
    "trend": "Growing",
    "source": "short source or evidence summary",
    "notes": "brief explanation of what the demand evidence means"
  }
]

Do not include markdown.
Do not add commentary before or after the JSON.`;

    await copyText(prompt, () => {
      setCopiedDemandPrompt(true);

      window.setTimeout(() => {
        setCopiedDemandPrompt(false);
      }, 1800);
    });
  }

  function normalizeTrend(value: unknown): DemandTrend["trend"] {
    const text = String(value || "")
      .trim()
      .toLowerCase();

    if (text === "growing") return "Growing";
    if (text === "stable") return "Stable";
    if (text === "falling") return "Falling";

    return "Unknown";
  }

  function importDemandTrend() {
    if (!project) return;

    setDemandImportMessage("");

    try {
      const parsed = JSON.parse(cleanJsonText(demandImportText)) as Array<{
        id?: string;
        days30?: string | number;
        days90?: string | number;
        months6?: string | number;
        months12?: string | number;
        trend?: string;
        source?: string;
        notes?: string;
      }>;

      if (!Array.isArray(parsed)) {
        setDemandImportMessage("The pasted result is not a demand list.");
        return;
      }

      let count = 0;

      const updatedProblems = problems.map((problem) => {
        const result = parsed.find((item) => item.id === problem.id);

        if (!result) return problem;

        count += 1;

        return {
          ...problem,
          demandTrend: {
            days30: String(result.days30 ?? "").trim(),
            days90: String(result.days90 ?? "").trim(),
            months6: String(result.months6 ?? "").trim(),
            months12: String(result.months12 ?? "").trim(),
            trend: normalizeTrend(result.trend),
            source: result.source?.trim() || "",
            notes: result.notes?.trim() || "",
          },
        };
      });

      if (count === 0) {
        setDemandImportMessage("No matching problem IDs found.");
        return;
      }

      saveProject({
        ...project,
        problems: updatedProblems,
      });

      setDemandImportText("");
      setDemandImportMessage(`${count} demand trends imported.`);
    } catch (error) {
      console.error(error);
      setDemandImportMessage("Could not read the demand-trend result.");
    }
  }

  function normalizeEvidenceLevel(
    value: unknown,
    allowed: string[],
    fallback: string,
  ) {
    const text = String(value || "").trim();

    const match = allowed.find(
      (item) => item.toLowerCase() === text.toLowerCase(),
    );

    return match || fallback;
  }

  function getOpportunityRadar(problem: ResearchProblem) {
    const evidence = problem.opportunityEvidence || EMPTY_OPPORTUNITY_EVIDENCE;

    let signals = 0;

    if (
      evidence.problemTrend === "Growing" ||
      evidence.problemTrend === "Stable"
    ) {
      signals += 1;
    }

    if (evidence.currentSolutionSpend.trim()) signals += 1;

    if (evidence.solutionFrustration === "High") signals += 1;

    if (evidence.switchingDifficulty === "Low") signals += 1;

    if (evidence.reachability === "Easy") signals += 1;

    if (evidence.diyWorkarounds === "Found") signals += 1;

    if (evidence.jobFrequency.trim()) signals += 1;

    if (evidence.costOfDoingNothing.trim()) signals += 1;

    if (evidence.smallestSellableJob.trim()) signals += 1;

    if (getTotalScore(problem.scores) >= 28) signals += 1;

    if (signals >= 8) {
      return {
        label: "🔥 Strong Product Territory",
        detail: `${signals}/10 strong signals`,
      };
    }

    if (signals >= 5) {
      return {
        label: "🟡 Worth Deeper Research",
        detail: `${signals}/10 strong signals`,
      };
    }

    return {
      label: "⚪ More Evidence Needed",
      detail: `${signals}/10 strong signals`,
    };
  }

  async function copyOpportunityEvidencePrompt() {
    if (!project || problems.length === 0) return;

    const data = problems
      .map(
        (problem, index) => `OPPORTUNITY ${index + 1}

ID:
${problem.id}

PROBLEM:
${problem.title}

DESCRIPTION:
${problem.description}

WHO HAS IT:
${problem.whoHasProblem}

CURRENT SOLUTION:
${problem.currentSolution}

WHY IT MATTERS:
${problem.whyItMatters}

EXISTING EVIDENCE:
${problem.evidence}

35-POINT SCORE:
${getTotalScore(problem.scores)} / 35

SEARCH DEMAND TREND:
${problem.demandTrend?.trend || "Unknown"}`,
      )
      .join("\n\n----------------------------------------\n\n");

    const prompt = `Research these opportunities inside the ${project.industry} industry.

I already have a separate 35-point opportunity score. DO NOT change that score.

Your job is to collect 10 additional OPPORTUNITY EVIDENCE signals for each problem so I can decide whether the market is truly worth entering.

RESEARCH THESE 10 SIGNALS:

1. problemTrend
Is this specific problem growing, stable, falling, or unknown? Look at recent complaints, workflow changes, technology changes, regulations, market behavior, and search/community activity.

2. buyerType
Who actually controls the money? Examples: Consumer, Freelancer, Small Business, Company, Enterprise, Government, Nonprofit. Be specific.

3. currentSolutionSpend
What are people already paying to solve this exact problem? Give real pricing examples or realistic ranges when verifiable. If unknown, say Unknown.

4. solutionFrustration
How frustrated are users with current paid/free solutions? Return High, Medium, Low, or Unknown. Look for complaints about price, complexity, missing features, poor support, bad workflow, or too many features.

5. switchingDifficulty
How hard would it be for the buyer to start using a focused new tool? Return Low, Medium, High, or Unknown. Consider setup, data migration, company approval, integrations, training, and workflow disruption.

6. reachability
How easy is it to find these buyers online? Return Easy, Medium, Hard, or Unknown. Name the best channels such as Reddit, Facebook groups, YouTube, Discord, forums, associations, marketplaces, search terms, or industry sites. Put those channel details in evidenceSummary.

7. diyWorkarounds
Are people trying to fix the problem themselves using spreadsheets, scripts, templates, manual steps, notes, or several apps? Return Found, Some, None, or Unknown.

8. jobFrequency
How often does the job/problem happen? Examples: Daily, Weekly, Every Client, Every Project, Monthly, Occasionally, Yearly.

9. costOfDoingNothing
What happens if the problem is ignored? Describe wasted time, mistakes, lost revenue, lost customers, delays, compliance risk, damaged files/data, or other consequences.

10. smallestSellableJob
What is the smallest single job a focused product could solve that someone may actually pay for? ONE PRODUCT = ONE JOB. Do not create an all-in-one platform.

IMPORTANT:
- Use current evidence when possible.
- Do not invent prices, complaints, communities, or trends.
- Separate facts from assumptions.
- Keep the exact problem ID.
- Be conservative.
- A small niche can still be strong if the buyers have money and the pain is real.

OPPORTUNITIES:

${data}

RETURN ONLY JSON:

[
  {
    "id": "exact problem ID",
    "problemTrend": "Growing",
    "buyerType": "specific buyer type",
    "currentSolutionSpend": "$ amount/range or Unknown",
    "solutionFrustration": "High",
    "switchingDifficulty": "Low",
    "reachability": "Easy",
    "diyWorkarounds": "Found",
    "jobFrequency": "Weekly",
    "costOfDoingNothing": "brief consequence",
    "smallestSellableJob": "one focused job",
    "evidenceSummary": "brief evidence, channels, competitors, pricing, workarounds, and important notes"
  }
]

Do not include markdown.
Do not add commentary before or after the JSON.`;

    await copyText(prompt, () => {
      setCopiedEvidencePrompt(true);

      window.setTimeout(() => {
        setCopiedEvidencePrompt(false);
      }, 1800);
    });
  }

  function importOpportunityEvidence() {
    if (!project) return;

    setEvidenceImportMessage("");

    try {
      const parsed = JSON.parse(cleanJsonText(evidenceImportText)) as Array<{
        id?: string;
        problemTrend?: string;
        buyerType?: string;
        currentSolutionSpend?: string | number;
        solutionFrustration?: string;
        switchingDifficulty?: string;
        reachability?: string;
        diyWorkarounds?: string;
        jobFrequency?: string;
        costOfDoingNothing?: string;
        smallestSellableJob?: string;
        evidenceSummary?: string;
      }>;

      if (!Array.isArray(parsed)) {
        setEvidenceImportMessage("The pasted result is not an evidence list.");
        return;
      }

      let count = 0;

      const updatedProblems = problems.map((problem) => {
        const result = parsed.find((item) => item.id === problem.id);

        if (!result) return problem;

        count += 1;

        return {
          ...problem,

          opportunityEvidence: {
            problemTrend: normalizeEvidenceLevel(
              result.problemTrend,
              ["Growing", "Stable", "Falling", "Unknown"],
              "Unknown",
            ) as OpportunityEvidence["problemTrend"],

            buyerType: String(result.buyerType ?? "").trim(),

            currentSolutionSpend: String(
              result.currentSolutionSpend ?? "",
            ).trim(),

            solutionFrustration: normalizeEvidenceLevel(
              result.solutionFrustration,
              ["High", "Medium", "Low", "Unknown"],
              "Unknown",
            ) as OpportunityEvidence["solutionFrustration"],

            switchingDifficulty: normalizeEvidenceLevel(
              result.switchingDifficulty,
              ["Low", "Medium", "High", "Unknown"],
              "Unknown",
            ) as OpportunityEvidence["switchingDifficulty"],

            reachability: normalizeEvidenceLevel(
              result.reachability,
              ["Easy", "Medium", "Hard", "Unknown"],
              "Unknown",
            ) as OpportunityEvidence["reachability"],

            diyWorkarounds: normalizeEvidenceLevel(
              result.diyWorkarounds,
              ["Found", "Some", "None", "Unknown"],
              "Unknown",
            ) as OpportunityEvidence["diyWorkarounds"],

            jobFrequency: String(result.jobFrequency ?? "").trim(),

            costOfDoingNothing: String(result.costOfDoingNothing ?? "").trim(),

            smallestSellableJob: String(
              result.smallestSellableJob ?? "",
            ).trim(),

            evidenceSummary: String(result.evidenceSummary ?? "").trim(),
          },
        };
      });

      if (count === 0) {
        setEvidenceImportMessage("No matching problem IDs found.");
        return;
      }

      saveProject({
        ...project,
        problems: updatedProblems,
      });

      setEvidenceImportText("");

      setEvidenceImportMessage(
        `${count} opportunity evidence records imported.`,
      );
    } catch (error) {
      console.error(error);

      setEvidenceImportMessage(
        "Could not read the opportunity-evidence result.",
      );
    }
  }

  function normalizeScore(value: unknown) {
    const number = Number(value);

    if (Number.isNaN(number)) return 0;

    return Math.min(5, Math.max(1, Math.round(number)));
  }

  function importScores() {
    if (!project) return;

    setScoreImportMessage("");

    try {
      const parsed = JSON.parse(cleanJsonText(scoreImportText)) as Array<{
        id?: string;
        frequency?: number;
        pain?: number;
        spending?: number;
        moneyAroundProblem?: number;
        solutionWeakness?: number;
        buildability?: number;
        payLikelihood?: number;
        reason?: string;
      }>;

      if (!Array.isArray(parsed)) {
        setScoreImportMessage("The pasted result is not a scoring list.");
        return;
      }

      let count = 0;

      const updatedProblems = problems.map((problem) => {
        const result = parsed.find((item) => item.id === problem.id);

        if (!result) return problem;

        count += 1;

        return {
          ...problem,

          scores: {
            frequency: normalizeScore(result.frequency),
            pain: normalizeScore(result.pain),
            spending: normalizeScore(result.spending),
            moneyAroundProblem: normalizeScore(result.moneyAroundProblem),
            solutionWeakness: normalizeScore(result.solutionWeakness),
            buildability: normalizeScore(result.buildability),
            payLikelihood: normalizeScore(result.payLikelihood),
          },

          scoreReason: result.reason?.trim() || "",
        };
      });

      if (count === 0) {
        setScoreImportMessage("No matching problem IDs found.");
        return;
      }

      saveProject({
        ...project,
        problems: updatedProblems,
      });

      setScoreImportText("");

      setScoreImportMessage(`${count} opportunities scored and ranked.`);
    } catch (error) {
      console.error(error);

      setScoreImportMessage("Could not read the scoring result.");
    }
  }

  function toggleRankedProblem(problemId: string) {
    setOpenRankedProblemId((current) =>
      current === problemId ? null : problemId,
    );
  }

  async function copyRankedResults() {
    if (!project || rankedProblems.length === 0) return;

    const rankedText = rankedProblems
      .map((problem, index) => {
        const total = getTotalScore(problem.scores);

        return `#${index + 1} ${problem.title} — ${total}/35

Frequency: ${problem.scores.frequency}/5
Pain: ${problem.scores.pain}/5
Spending: ${problem.scores.spending}/5
Money Around the Problem: ${problem.scores.moneyAroundProblem}/5
Solution Weakness: ${problem.scores.solutionWeakness}/5
Buildability: ${problem.scores.buildability}/5
Pay Likelihood: ${problem.scores.payLikelihood}/5

Reason:
${problem.scoreReason || "No score reason saved."}`;
      })
      .join("\n\n----------------------------------------\n\n");

    await copyText(rankedText, () => {
      setCopiedRankedResults(true);

      window.setTimeout(() => {
        setCopiedRankedResults(false);
      }, 1800);
    });
  }

  // =========================================================
  // STEP 4
  // =========================================================

  async function copyIdeaGenerationPrompt() {
    if (!project || problems.length === 0) return;

    const usableProblems = rankedProblems.filter(
      (problem) => getTotalScore(problem.scores) > 0,
    );

    const sourceProblems =
      usableProblems.length > 0 ? usableProblems : rankedProblems;

    const data = sourceProblems
      .map(
        (problem, index) => `OPPORTUNITY ${index + 1}

PROBLEM ID:
${problem.id}

PROBLEM:
${problem.title}

TOTAL OPPORTUNITY SCORE:
${getTotalScore(problem.scores)} / 35

WHO HAS IT:
${problem.whoHasProblem}

PROBLEM DESCRIPTION:
${problem.description}

CURRENT SOLUTION:
${problem.currentSolution}

WHY IT MATTERS:
${problem.whyItMatters}

EVIDENCE:
${problem.evidence}`,
      )
      .join("\n\n----------------------------------------\n\n");

    const prompt = `I have researched the ${project.industry} industry, found problems, and ranked the opportunities.

Now turn the strongest problems into SMALL, FOCUSED product ideas.

IMPORTANT RULE:

ONE PRODUCT = ONE JOB DONE VERY WELL.

Do not build an all-in-one platform.

Do not combine unrelated problems.

Prefer products that:

- solve a clear repeated job
- remove manual work
- reduce mistakes
- save time
- replace an annoying workaround
- are easy to explain
- have a specific user
- could realistically have a Version 1
- can stand alone even if larger software exists

OPPORTUNITIES:

${data}

For strong problems, you may generate more than one product approach if the approaches truly solve different one-job use cases.

RETURN ONLY JSON.

Use exactly:

[
  {
    "title": "Product name or clear working title",
    "problemId": "exact problem ID",
    "problemTitle": "problem being solved",
    "targetUser": "specific person or business who uses it",
    "oneJob": "the ONE job this product performs",
    "currentWorkaround": "how the user handles this job now",
    "whyUseful": "why this focused product would be useful",
    "versionOne": "the smallest useful Version 1",
    "pricingThought": "brief initial pricing thought"
  }
]

Do not include markdown.
Do not add commentary before or after the JSON.`;

    await copyText(prompt, () => {
      setCopiedIdeaPrompt(true);

      window.setTimeout(() => {
        setCopiedIdeaPrompt(false);
      }, 1800);
    });
  }

  function importIdeas() {
    if (!project) return;

    setIdeaImportMessage("");

    try {
      const parsed = JSON.parse(cleanJsonText(ideaImportText)) as Array<{
        title?: string;
        problemId?: string;
        problemTitle?: string;
        targetUser?: string;
        oneJob?: string;
        currentWorkaround?: string;
        whyUseful?: string;
        versionOne?: string;
        pricingThought?: string;
      }>;

      if (!Array.isArray(parsed)) {
        setIdeaImportMessage("The pasted result is not an idea list.");
        return;
      }

      const imported: ProductIdea[] = parsed
        .filter((item) => typeof item.title === "string" && item.title.trim())
        .map((item) => ({
          id: makeId("idea"),

          title: item.title?.trim() || "Untitled Product",

          problemId: item.problemId?.trim() || "",

          problemTitle: item.problemTitle?.trim() || "",

          targetUser: item.targetUser?.trim() || "",

          oneJob: item.oneJob?.trim() || "",

          currentWorkaround: item.currentWorkaround?.trim() || "",

          whyUseful: item.whyUseful?.trim() || "",

          versionOne: item.versionOne?.trim() || "",

          pricingThought: item.pricingThought?.trim() || "",

          notes: "",

          isManual: false,
        }));

      if (imported.length === 0) {
        setIdeaImportMessage("No usable product ideas were found.");
        return;
      }

      saveProject({
        ...project,
        ideas: [...ideas, ...imported],
      });

      setIdeaImportText("");

      setIdeaImportMessage(`${imported.length} product ideas imported.`);
    } catch (error) {
      console.error(error);

      setIdeaImportMessage(
        "Could not read the product idea result. Paste the complete JSON response.",
      );
    }
  }

  function addManualIdea() {
    if (!project || !manualIdeaTitle.trim()) return;

    const sourceProblem = problems.find(
      (problem) => problem.id === manualIdeaProblemId,
    );

    const newIdea: ProductIdea = {
      id: makeId("idea"),

      title: manualIdeaTitle.trim(),

      problemId: sourceProblem?.id || "",

      problemTitle: sourceProblem?.title || "",

      targetUser: manualIdeaUser.trim(),

      oneJob: manualIdeaJob.trim(),

      currentWorkaround: sourceProblem?.currentSolution || "",

      whyUseful: sourceProblem?.whyItMatters || "",

      versionOne: "",

      pricingThought: "",

      notes: "",

      isManual: true,
    };

    saveProject({
      ...project,
      ideas: [...ideas, newIdea],
    });

    setManualIdeaTitle("");
    setManualIdeaProblemId("");
    setManualIdeaUser("");
    setManualIdeaJob("");
    setShowAddIdea(false);
  }

  function deleteIdea(ideaId: string) {
    if (!project) return;

    if (!window.confirm("Delete this idea?")) return;

    saveProject({
      ...project,

      ideas: ideas.filter((idea) => idea.id !== ideaId),

      winnerIdeaId: project.winnerIdeaId === ideaId ? "" : project.winnerIdeaId,
    });
  }

  function selectWinner(ideaId: string) {
    if (!project) return;

    saveProject({
      ...project,
      winnerIdeaId: ideaId,
    });

    setMoveMessage("");
  }

  function moveWinnerToDevelopIdea() {
    if (!project || !winnerIdea) return;

    try {
      const saved = window.localStorage.getItem(DEVELOP_IDEA_STORAGE_KEY);

      const existing: DevelopIdeaProject[] = saved ? JSON.parse(saved) : [];

      const alreadyExists = existing.find(
        (item) => item.sourceIdeaId === winnerIdea.id,
      );

      if (alreadyExists) {
        setMoveMessage("This winner is already in Develop Idea.");
        return;
      }

      const sourceProblem = problems.find(
        (problem) => problem.id === winnerIdea.problemId,
      );

      const newDevelopProject: DevelopIdeaProject = {
        id: Date.now(),

        sourceIndustryProjectId: project.id,

        sourceIdeaId: winnerIdea.id,

        industry: project.industry,

        productName: winnerIdea.title,

        targetUser: winnerIdea.targetUser,

        problem: sourceProblem?.description || winnerIdea.problemTitle,

        oneJob: winnerIdea.oneJob,

        currentWorkaround: winnerIdea.currentWorkaround,

        whyUseful: winnerIdea.whyUseful,

        versionOne: winnerIdea.versionOne,

        pricingThought: winnerIdea.pricingThought,

        notes: winnerIdea.notes,

        createdAt: new Date().toLocaleDateString(),

        status: "Developing",
      };

      window.localStorage.setItem(
        DEVELOP_IDEA_STORAGE_KEY,
        JSON.stringify([newDevelopProject, ...existing]),
      );

      setMoveMessage(
        `${winnerIdea.title} was moved into Stage 2 — Develop Idea.`,
      );
    } catch (error) {
      console.error("Could not move winner:", error);

      setMoveMessage("Could not move this idea into Develop Idea.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5efe1] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-bold">Loading research project...</p>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#f5efe1] px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10">
          <h1 className="text-4xl font-bold">Project not found.</h1>

          <Link
            href="/research/industry-research"
            className="mt-7 inline-block rounded-xl bg-[#7a1d1d] px-6 py-3 font-bold text-white"
          >
            Back to Industry Research
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5efe1] text-[#1a1a1a]">
      {/* HERO */}
      <section className="bg-[#333333] px-6 py-12 text-white sm:px-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/research/industry-research"
            className="text-sm font-bold text-[#d8d4cb]"
          >
            ← Industry Research
          </Link>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-[#d8d4cb]">
            Research Project
          </p>

          <h1 className="mt-3 text-4xl font-bold sm:text-6xl">
            {project.industry}
          </h1>

          {project.focus && (
            <p className="mt-5 max-w-3xl text-lg text-[#d8d4cb]">
              {project.focus}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        {/* FLOW */}
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#7a1d1d]">Step 1</p>

            <h2 className="mt-2 font-bold">Understand Market</h2>

            <p className="mt-3 text-sm">
              {hasFullResearch
                ? "Full research saved"
                : `${answeredCount}/${questions.length} answered`}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#7a1d1d]">Step 2</p>

            <h2 className="mt-2 font-bold">Find Problems</h2>

            <p className="mt-3 text-sm">{problems.length} collected</p>
          </div>

          <div className="rounded-3xl bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#7a1d1d]">Step 3</p>

            <h2 className="mt-2 font-bold">Rank Opportunities</h2>

            <p className="mt-3 text-sm">
              {scoredProblemsCount}/{problems.length} scored
            </p>
          </div>

          <div
            className={`rounded-3xl bg-white p-5 ${
              winnerIdea ? "border-2 border-[#7a1d1d]" : ""
            }`}
          >
            <p className="text-xs font-bold uppercase text-[#7a1d1d]">Step 4</p>

            <h2 className="mt-2 font-bold">Generate Ideas</h2>

            <p className="mt-3 text-sm">{ideas.length} ideas</p>
          </div>
        </div>

        {/* STEP 1 */}
        <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setShowResearchQuestionsSection((current) => !current)
            }
            className="flex w-full items-center justify-between gap-5 text-left"
          >
            <div>
              <p className="text-sm font-bold uppercase text-[#7a1d1d]">
                Step 1
              </p>

              <h2 className="mt-2 text-3xl font-bold">Research Questions</h2>

              <p className="mt-2 text-sm text-black/50">
                {hasFullResearch
                  ? "Full research saved ✓"
                  : `${answeredCount}/${questions.length} answered`}
              </p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5efe1] text-2xl font-bold">
              {showResearchQuestionsSection ? "−" : "+"}
            </span>
          </button>

          {showResearchQuestionsSection && (
            <div className="mt-6 border-t pt-6">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={copyFullResearchPrompt}
                  className="rounded-xl bg-[#333333] px-5 py-3 text-sm font-bold text-white"
                >
                  {copiedFullPrompt ? "Copied ✓" : "Copy Full Research Prompt"}
                </button>

                <button
                  onClick={() => setShowAddQuestion(true)}
                  className="rounded-xl bg-[#7a1d1d] px-5 py-3 text-sm font-bold text-white"
                >
                  + Add Question
                </button>
              </div>

              {showAddQuestion && (
                <div className="mt-6 rounded-2xl bg-[#f5efe1] p-5">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                    placeholder="Category"
                  />

                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    rows={4}
                    className="mt-3 w-full rounded-xl border px-4 py-3"
                    placeholder="Research question"
                  />

                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={addCustomQuestion}
                      className="rounded-xl bg-[#7a1d1d] px-5 py-3 font-bold text-white"
                    >
                      Add
                    </button>

                    <button
                      onClick={() => setShowAddQuestion(false)}
                      className="font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                {questions.map((question, index) => {
                  const open = openQuestionId === question.id;

                  const answered = question.answer.trim().length > 0;

                  return (
                    <div
                      key={question.id}
                      className="overflow-hidden rounded-2xl border"
                    >
                      <button
                        onClick={() =>
                          setOpenQuestionId(open ? null : question.id)
                        }
                        className="flex w-full items-start gap-4 p-5 text-left"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${
                            answered
                              ? "bg-[#7a1d1d] text-white"
                              : "bg-[#f5efe1]"
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div className="flex-1">
                          <p className="text-xs font-bold uppercase text-[#7a1d1d]">
                            {question.category}
                          </p>

                          <p className="mt-2 font-bold">{question.question}</p>
                        </div>

                        <span>{open ? "−" : "+"}</span>
                      </button>

                      {open && (
                        <div className="border-t bg-[#f5efe1]/50 p-5">
                          <input
                            value={question.category}
                            onChange={(e) =>
                              updateQuestionCategory(
                                question.id,
                                e.target.value,
                              )
                            }
                            className="w-full rounded-xl border px-4 py-3"
                          />

                          <textarea
                            value={question.question}
                            onChange={(e) =>
                              updateQuestionText(question.id, e.target.value)
                            }
                            rows={4}
                            className="mt-3 w-full rounded-xl border px-4 py-3"
                          />

                          <div className="mt-3 flex gap-3">
                            <button
                              onClick={() => copyQuestion(question)}
                              className="rounded-xl bg-[#333333] px-5 py-3 text-sm font-bold text-white"
                            >
                              {copiedQuestionId === question.id
                                ? "Copied ✓"
                                : "Copy Prompt"}
                            </button>

                            <button
                              onClick={() => deleteQuestion(question.id)}
                              className="text-sm font-bold text-[#7a1d1d]"
                            >
                              Remove
                            </button>
                          </div>

                          <textarea
                            value={question.answer}
                            onChange={(e) =>
                              updateAnswer(question.id, e.target.value)
                            }
                            rows={10}
                            placeholder="Optional: Paste an individual research answer here..."
                            className="mt-5 w-full rounded-xl border bg-white px-4 py-4"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* FULL RESEARCH RESULT */}
              <div className="mt-8 rounded-3xl border-2 border-[#7a1d1d] bg-[#f5efe1] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
                      Full Research Result
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      Paste the complete ChatGPT research here.
                    </h3>

                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/60">
                      Use Copy Full Research Prompt above, get the full answer
                      from ChatGPT, then paste the entire research result here.
                      Step 2 can use this complete result directly.
                    </p>
                  </div>

                  {project.fullResearchResult?.trim() && (
                    <span className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#7a1d1d]">
                      Saved Locally ✓
                    </span>
                  )}
                </div>

                <textarea
                  value={project.fullResearchResult || ""}
                  onChange={(event) =>
                    updateFullResearchResult(event.target.value)
                  }
                  rows={22}
                  placeholder="Paste ChatGPT's complete research answer here..."
                  className="mt-5 w-full resize-y rounded-2xl border border-black/15 bg-white px-5 py-5 leading-relaxed outline-none transition focus:border-[#7a1d1d]"
                />

                <p className="mt-2 text-xs font-bold text-black/40">
                  Auto-saves locally to this research project.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2 */}
        <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm">
          <button
            type="button"
            onClick={() => setShowFindProblemsSection((current) => !current)}
            className="flex w-full items-center justify-between gap-5 text-left"
          >
            <div>
              <p className="text-sm font-bold uppercase text-[#7a1d1d]">
                Step 2
              </p>

              <h2 className="mt-2 text-3xl font-bold">Find Problems</h2>

              <p className="mt-2 text-sm text-black/50">
                {problems.length} problems collected
              </p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5efe1] text-2xl font-bold">
              {showFindProblemsSection ? "−" : "+"}
            </span>
          </button>

          {showFindProblemsSection && (
            <div className="mt-6 border-t pt-6">
              {hasResearchForProblems ? (
                <>
                  <div className="rounded-2xl bg-[#f5efe1] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a1d1d]">
                      Research Ready
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Pull problems from your saved research.
                    </h3>

                    <p className="mt-2 text-sm text-black/60">
                      {hasFullResearch
                        ? "Your Full Research Result will be used."
                        : "Your saved individual question answers will be used."}
                    </p>

                    <button
                      onClick={copyProblemFindingPrompt}
                      className="mt-5 rounded-xl bg-[#7a1d1d] px-6 py-3 font-bold text-white"
                    >
                      {copiedProblemPrompt
                        ? "Copied ✓"
                        : "Copy Problem-Finding Prompt"}
                    </button>
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#333333] p-5 text-white">
                    <p className="font-bold">Paste the problem JSON here.</p>

                    <textarea
                      value={problemImportText}
                      onChange={(e) => setProblemImportText(e.target.value)}
                      rows={9}
                      placeholder="Paste JSON problem result..."
                      className="mt-4 w-full rounded-xl bg-white px-4 py-4 text-black"
                    />

                    <button
                      onClick={importProblems}
                      disabled={!problemImportText.trim()}
                      className="mt-3 rounded-xl bg-[#7a1d1d] px-5 py-3 font-bold disabled:opacity-40"
                    >
                      Import Problems
                    </button>

                    {problemImportMessage && (
                      <p className="mt-3">{problemImportMessage}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-black/60">
                  Complete Step 1 first. Paste research into Full Research
                  Result or save at least one individual research answer.
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowAddProblem(true)}
                  className="rounded-xl border px-4 py-2 text-sm font-bold"
                >
                  + Add Problem
                </button>

                {problems.length > 0 && (
                  <>
                    <button
                      onClick={copyAllProblems}
                      className="rounded-xl bg-[#333333] px-4 py-2 text-sm font-bold text-white"
                    >
                      {copiedAllProblems ? "Copied ✓" : "Copy All"}
                    </button>

                    <button
                      onClick={deleteAllProblems}
                      className="text-sm font-bold text-[#7a1d1d]"
                    >
                      Delete All
                    </button>
                  </>
                )}
              </div>

              {showAddProblem && (
                <div className="mt-5 rounded-2xl bg-[#f5efe1] p-5">
                  <input
                    value={manualProblemTitle}
                    onChange={(e) => setManualProblemTitle(e.target.value)}
                    placeholder="Problem title"
                    className="w-full rounded-xl border px-4 py-3"
                  />

                  <input
                    value={manualProblemWho}
                    onChange={(e) => setManualProblemWho(e.target.value)}
                    placeholder="Who has this problem?"
                    className="mt-3 w-full rounded-xl border px-4 py-3"
                  />

                  <textarea
                    value={manualProblemDescription}
                    onChange={(e) =>
                      setManualProblemDescription(e.target.value)
                    }
                    placeholder="Description"
                    rows={4}
                    className="mt-3 w-full rounded-xl border px-4 py-3"
                  />

                  <textarea
                    value={manualProblemEvidence}
                    onChange={(e) => setManualProblemEvidence(e.target.value)}
                    placeholder="Evidence"
                    rows={4}
                    className="mt-3 w-full rounded-xl border px-4 py-3"
                  />

                  <button
                    onClick={addManualProblem}
                    className="mt-3 rounded-xl bg-[#7a1d1d] px-5 py-3 font-bold text-white"
                  >
                    Save Problem
                  </button>
                </div>
              )}

              <div className="mt-6 space-y-4">
                {problems.map((problem) => (
                  <div key={problem.id} className="rounded-2xl border p-5">
                    <div className="flex justify-between gap-5">
                      <div>
                        <p className="text-xs font-bold uppercase text-[#7a1d1d]">
                          {problem.sourceCategory}
                        </p>

                        <h3 className="mt-2 text-xl font-bold">
                          {problem.title}
                        </h3>
                      </div>

                      <button
                        onClick={() => deleteProblem(problem.id)}
                        className="text-sm font-bold text-black/40"
                      >
                        Delete
                      </button>
                    </div>

                    <p className="mt-3 text-black/60">{problem.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* STEP 3 */}
        <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setShowRankOpportunitiesSection((current) => !current)
            }
            className="flex w-full items-center justify-between gap-5 text-left"
          >
            <div>
              <p className="text-sm font-bold uppercase text-[#7a1d1d]">
                Step 3
              </p>

              <h2 className="mt-2 text-3xl font-bold">Rank Opportunities</h2>

              <p className="mt-2 text-sm text-black/50">
                {scoredProblemsCount}/{problems.length} scored ·{" "}
                {problems.length} opportunities
              </p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5efe1] text-2xl font-bold">
              {showRankOpportunitiesSection ? "−" : "+"}
            </span>
          </button>

          {showRankOpportunitiesSection && (
            <div className="mt-6 border-t pt-6">
              {problems.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-black/60">
                  Find problems first.
                </div>
              ) : (
                <>
                  <div className="rounded-2xl bg-[#333333] p-5 text-white">
                    <button
                      onClick={copyScoringPrompt}
                      className="rounded-xl bg-[#7a1d1d] px-5 py-3 font-bold"
                    >
                      {copiedScorePrompt ? "Copied ✓" : "Copy Scoring Prompt"}
                    </button>

                    <textarea
                      value={scoreImportText}
                      onChange={(e) => setScoreImportText(e.target.value)}
                      rows={8}
                      placeholder="Paste scoring JSON..."
                      className="mt-4 w-full rounded-xl bg-white px-4 py-4 text-black"
                    />

                    <button
                      onClick={importScores}
                      disabled={!scoreImportText.trim()}
                      className="mt-3 rounded-xl bg-[#7a1d1d] px-5 py-3 font-bold disabled:opacity-40"
                    >
                      Import Scores & Rank
                    </button>

                    {scoreImportMessage && (
                      <p className="mt-3">{scoreImportMessage}</p>
                    )}
                  </div>

                  <div className="mt-6 overflow-hidden rounded-2xl border-2 border-[#7a1d1d] bg-white">
                    <button
                      type="button"
                      onClick={() =>
                        setShowRankedResults((current) => !current)
                      }
                      className="flex w-full items-center justify-between gap-5 p-5 text-left"
                    >
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a1d1d]">
                          Ranked Results
                        </p>

                        <h3 className="mt-2 text-2xl font-bold">
                          See the full ranking in one place
                        </h3>

                        <p className="mt-1 text-sm text-black/50">
                          {rankedProblems.length} opportunities ranked
                        </p>
                      </div>

                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5efe1] text-xl font-bold">
                        {showRankedResults ? "−" : "+"}
                      </span>
                    </button>

                    {showRankedResults && (
                      <div className="border-t p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-black/60">
                            Click any ranked result to open its full score and
                            research details.
                          </p>

                          <button
                            type="button"
                            onClick={copyRankedResults}
                            className="shrink-0 rounded-xl bg-[#333333] px-5 py-3 text-sm font-bold text-white"
                          >
                            {copiedRankedResults
                              ? "Copied ✓"
                              : "Copy All Results"}
                          </button>
                        </div>

                        <div className="mt-5 space-y-3">
                          {rankedProblems.map((problem, index) => {
                            const total = getTotalScore(problem.scores);
                            const radar = getOpportunityRadar(problem);
                            const opportunityEvidence =
                              problem.opportunityEvidence ||
                              EMPTY_OPPORTUNITY_EVIDENCE;
                            const open = openRankedProblemId === problem.id;

                            return (
                              <div
                                key={`ranked-result-${problem.id}`}
                                className={`overflow-hidden rounded-xl ${
                                  index === 0 && total > 0
                                    ? "border border-[#7a1d1d] bg-[#f5efe1]"
                                    : "border bg-[#f5efe1]"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleRankedProblem(problem.id)
                                  }
                                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase text-[#7a1d1d]">
                                      #{index + 1}
                                    </p>

                                    <p className="mt-1 font-bold">
                                      {problem.title}
                                    </p>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-3">
                                    <div className="rounded-lg bg-white px-3 py-2 text-center">
                                      <p className="font-bold">{total}</p>
                                      <p className="text-[10px] text-black/40">
                                        /35
                                      </p>
                                    </div>

                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold">
                                      {open ? "−" : "+"}
                                    </span>
                                  </div>
                                </button>

                                {open && (
                                  <div className="border-t bg-white p-5">
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                      {(
                                        [
                                          ["frequency", "Frequency"],
                                          ["pain", "Pain"],
                                          ["spending", "Spending"],
                                          [
                                            "moneyAroundProblem",
                                            "Money Around the Problem",
                                          ],
                                          [
                                            "solutionWeakness",
                                            "Solution Weakness",
                                          ],
                                          ["buildability", "Buildability"],
                                          ["payLikelihood", "Pay Likelihood"],
                                        ] as Array<
                                          [keyof ProblemScores, string]
                                        >
                                      ).map(([key, label]) => (
                                        <div
                                          key={key}
                                          className="rounded-xl bg-[#f5efe1] p-3"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold">
                                              {label}
                                            </span>

                                            <select
                                              value={problem.scores[key]}
                                              onChange={(e) =>
                                                updateProblemScore(
                                                  problem.id,
                                                  key,
                                                  Number(e.target.value),
                                                )
                                              }
                                              className="rounded-lg border bg-white px-2 py-1"
                                            >
                                              <option value={0}>—</option>
                                              <option value={1}>1</option>
                                              <option value={2}>2</option>
                                              <option value={3}>3</option>
                                              <option value={4}>4</option>
                                              <option value={5}>5</option>
                                            </select>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {problem.scoreReason && (
                                      <p className="mt-4 text-sm text-black/60">
                                        {problem.scoreReason}
                                      </p>
                                    )}

                                    <div className="mt-5 rounded-2xl border bg-white p-4">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a1d1d]">
                                            Demand Trend
                                          </p>

                                          <p className="mt-1 text-sm text-black/50">
                                            Search interest over time — not part
                                            of the /35 score
                                          </p>
                                        </div>

                                        <span className="rounded-full bg-[#f5efe1] px-4 py-2 text-sm font-bold">
                                          {problem.demandTrend?.trend ||
                                            "Unknown"}
                                        </span>
                                      </div>

                                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        {[
                                          [
                                            "30 Days",
                                            problem.demandTrend?.days30,
                                          ],
                                          [
                                            "90 Days",
                                            problem.demandTrend?.days90,
                                          ],
                                          [
                                            "6 Months",
                                            problem.demandTrend?.months6,
                                          ],
                                          [
                                            "12 Months",
                                            problem.demandTrend?.months12,
                                          ],
                                        ].map(([label, value]) => (
                                          <div
                                            key={label}
                                            className="rounded-xl bg-[#f5efe1] p-3"
                                          >
                                            <p className="text-xs font-bold uppercase text-black/40">
                                              {label}
                                            </p>

                                            <p className="mt-2 font-bold">
                                              {value || "Not researched"}
                                            </p>
                                          </div>
                                        ))}
                                      </div>

                                      {problem.demandTrend?.source && (
                                        <p className="mt-4 text-xs text-black/50">
                                          <span className="font-bold">
                                            Evidence:
                                          </span>{" "}
                                          {problem.demandTrend.source}
                                        </p>
                                      )}

                                      {problem.demandTrend?.notes && (
                                        <p className="mt-2 text-sm leading-relaxed text-black/60">
                                          {problem.demandTrend.notes}
                                        </p>
                                      )}
                                    </div>

                                    <div className="mt-5 rounded-2xl bg-[#333333] p-5 text-white">
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d8d4cb]">
                                            Opportunity Radar
                                          </p>

                                          <p className="mt-2 text-xl font-bold">
                                            {radar.label}
                                          </p>
                                        </div>

                                        <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                                          {radar.detail}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mt-4 rounded-2xl border bg-white p-4">
                                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a1d1d]">
                                        10 Opportunity Evidence Signals
                                      </p>

                                      <p className="mt-1 text-sm text-black/50">
                                        Extra evidence — not part of the /35
                                        score
                                      </p>

                                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {[
                                          [
                                            "1. Problem Trend",
                                            opportunityEvidence.problemTrend,
                                          ],
                                          [
                                            "2. Who Is Paying",
                                            opportunityEvidence.buyerType,
                                          ],
                                          [
                                            "3. Current Solution Spend",
                                            opportunityEvidence.currentSolutionSpend,
                                          ],
                                          [
                                            "4. Solution Frustration",
                                            opportunityEvidence.solutionFrustration,
                                          ],
                                          [
                                            "5. Switching Difficulty",
                                            opportunityEvidence.switchingDifficulty,
                                          ],
                                          [
                                            "6. Buyer Reachability",
                                            opportunityEvidence.reachability,
                                          ],
                                          [
                                            "7. DIY Workarounds",
                                            opportunityEvidence.diyWorkarounds,
                                          ],
                                          [
                                            "8. Job Frequency",
                                            opportunityEvidence.jobFrequency,
                                          ],
                                          [
                                            "9. Cost of Doing Nothing",
                                            opportunityEvidence.costOfDoingNothing,
                                          ],
                                          [
                                            "10. Smallest Sellable Job",
                                            opportunityEvidence.smallestSellableJob,
                                          ],
                                        ].map(([label, value]) => (
                                          <div
                                            key={label}
                                            className="rounded-xl bg-[#f5efe1] p-3"
                                          >
                                            <p className="text-xs font-bold uppercase text-black/40">
                                              {label}
                                            </p>

                                            <p className="mt-2 text-sm font-bold">
                                              {value || "Not researched"}
                                            </p>
                                          </div>
                                        ))}
                                      </div>

                                      {opportunityEvidence.evidenceSummary && (
                                        <div className="mt-4 rounded-xl border border-black/10 p-4">
                                          <p className="text-xs font-bold uppercase text-black/40">
                                            Evidence Summary
                                          </p>

                                          <p className="mt-2 text-sm leading-relaxed text-black/60">
                                            {
                                              opportunityEvidence.evidenceSummary
                                            }
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl border-2 border-[#7a1d1d] bg-[#f5efe1] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a1d1d]">
                          Demand Trend
                        </p>

                        <h3 className="mt-2 text-2xl font-bold">
                          Is anybody actively researching this problem?
                        </h3>

                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/60">
                          Check demand across 30 days, 90 days, 6 months, and 12
                          months. This does not change the 35-point opportunity
                          score. It gives you another signal before choosing
                          what to build.
                        </p>
                      </div>

                      <button
                        onClick={copyDemandTrendPrompt}
                        className="shrink-0 rounded-xl bg-[#333333] px-5 py-3 text-sm font-bold text-white"
                      >
                        {copiedDemandPrompt
                          ? "Demand Prompt Copied ✓"
                          : "Copy Demand Trend Prompt"}
                      </button>
                    </div>

                    <textarea
                      value={demandImportText}
                      onChange={(e) => setDemandImportText(e.target.value)}
                      rows={8}
                      placeholder="Paste demand-trend JSON here..."
                      className="mt-4 w-full rounded-xl border bg-white px-4 py-4 text-black"
                    />

                    <button
                      onClick={importDemandTrend}
                      disabled={!demandImportText.trim()}
                      className="mt-3 rounded-xl bg-[#7a1d1d] px-5 py-3 font-bold text-white disabled:opacity-40"
                    >
                      Import Demand Trend
                    </button>

                    {demandImportMessage && (
                      <p className="mt-3 font-bold text-[#7a1d1d]">
                        {demandImportMessage}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl border-2 border-[#333333] bg-white p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a1d1d]">
                          Opportunity Evidence
                        </p>

                        <h3 className="mt-2 text-2xl font-bold">
                          Research the 10 signals behind the score
                        </h3>

                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/60">
                          Buyer, spending, frustration, switching difficulty,
                          reachability, DIY workarounds, frequency, cost of
                          doing nothing, trend, and the smallest sellable job.
                          These do not change the /35 score.
                        </p>
                      </div>

                      <button
                        onClick={copyOpportunityEvidencePrompt}
                        className="shrink-0 rounded-xl bg-[#333333] px-5 py-3 text-sm font-bold text-white"
                      >
                        {copiedEvidencePrompt
                          ? "Evidence Prompt Copied ✓"
                          : "Copy 10-Signal Research Prompt"}
                      </button>
                    </div>

                    <textarea
                      value={evidenceImportText}
                      onChange={(e) => setEvidenceImportText(e.target.value)}
                      rows={10}
                      placeholder="Paste the 10-signal opportunity evidence JSON here..."
                      className="mt-4 w-full rounded-xl border bg-[#f5efe1] px-4 py-4 text-black"
                    />

                    <button
                      onClick={importOpportunityEvidence}
                      disabled={!evidenceImportText.trim()}
                      className="mt-3 rounded-xl bg-[#7a1d1d] px-5 py-3 font-bold text-white disabled:opacity-40"
                    >
                      Import Opportunity Evidence
                    </button>

                    {evidenceImportMessage && (
                      <p className="mt-3 font-bold text-[#7a1d1d]">
                        {evidenceImportMessage}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* STEP 4 */}
        <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm">
          <button
            type="button"
            onClick={() => setShowGenerateIdeasSection((current) => !current)}
            className="flex w-full items-center justify-between gap-5 text-left"
          >
            <div>
              <p className="text-sm font-bold uppercase text-[#7a1d1d]">
                Step 4
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Generate Product Ideas
              </h2>

              <p className="mt-2 text-sm text-black/50">
                {ideas.length} ideas
                {winnerIdea ? " · winner selected ✓" : ""}
              </p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5efe1] text-2xl font-bold">
              {showGenerateIdeasSection ? "−" : "+"}
            </span>
          </button>

          {showGenerateIdeasSection && (
            <div className="mt-6 border-t pt-6">
              {problems.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-black/60">
                  Find problems first.
                </div>
              ) : (
                <>
                  <div className="rounded-3xl bg-[#333333] p-6 text-white">
                    <h3 className="text-2xl font-bold">
                      Generate ideas from the evidence
                    </h3>

                    <p className="mt-2 text-[#d8d4cb]">
                      One product = one job done very well.
                    </p>

                    <button
                      onClick={copyIdeaGenerationPrompt}
                      className="mt-5 rounded-xl bg-[#7a1d1d] px-6 py-3 font-bold"
                    >
                      {copiedIdeaPrompt
                        ? "Idea Prompt Copied ✓"
                        : "Copy Product-Idea Prompt"}
                    </button>

                    <textarea
                      value={ideaImportText}
                      onChange={(e) => setIdeaImportText(e.target.value)}
                      rows={10}
                      placeholder="Paste ChatGPT product idea JSON here..."
                      className="mt-5 w-full rounded-xl bg-white px-4 py-4 text-black"
                    />

                    <button
                      onClick={importIdeas}
                      disabled={!ideaImportText.trim()}
                      className="mt-3 rounded-xl bg-[#7a1d1d] px-6 py-3 font-bold disabled:opacity-40"
                    >
                      Import Product Ideas
                    </button>

                    {ideaImportMessage && (
                      <p className="mt-3 rounded-xl bg-white/10 p-3">
                        {ideaImportMessage}
                      </p>
                    )}
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => setShowAddIdea(true)}
                      className="rounded-xl border px-4 py-2 text-sm font-bold"
                    >
                      + Add Idea Manually
                    </button>
                  </div>

                  {showAddIdea && (
                    <div className="mt-5 rounded-2xl bg-[#f5efe1] p-5">
                      <input
                        value={manualIdeaTitle}
                        onChange={(e) => setManualIdeaTitle(e.target.value)}
                        placeholder="Product idea name"
                        className="w-full rounded-xl border px-4 py-3"
                      />

                      <select
                        value={manualIdeaProblemId}
                        onChange={(e) => setManualIdeaProblemId(e.target.value)}
                        className="mt-3 w-full rounded-xl border bg-white px-4 py-3"
                      >
                        <option value="">Choose source problem</option>

                        {rankedProblems.map((problem) => (
                          <option key={problem.id} value={problem.id}>
                            {problem.title}
                          </option>
                        ))}
                      </select>

                      <input
                        value={manualIdeaUser}
                        onChange={(e) => setManualIdeaUser(e.target.value)}
                        placeholder="Who is it for?"
                        className="mt-3 w-full rounded-xl border px-4 py-3"
                      />

                      <textarea
                        value={manualIdeaJob}
                        onChange={(e) => setManualIdeaJob(e.target.value)}
                        rows={3}
                        placeholder="What ONE job does it do?"
                        className="mt-3 w-full rounded-xl border px-4 py-3"
                      />

                      <button
                        onClick={addManualIdea}
                        className="mt-3 rounded-xl bg-[#7a1d1d] px-5 py-3 font-bold text-white"
                      >
                        Save Idea
                      </button>
                    </div>
                  )}

                  <div className="mt-7 grid gap-5 lg:grid-cols-2">
                    {ideas.map((idea) => {
                      const selected = project.winnerIdeaId === idea.id;

                      const sourceProblem = problems.find(
                        (problem) => problem.id === idea.problemId,
                      );

                      const sourceScore = sourceProblem
                        ? getTotalScore(sourceProblem.scores)
                        : 0;

                      return (
                        <div
                          key={idea.id}
                          className={`rounded-3xl p-6 ${
                            selected
                              ? "border-2 border-[#7a1d1d] bg-[#fffdf8] shadow-md"
                              : "border bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              {selected && (
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a1d1d]">
                                  Selected Winner
                                </p>
                              )}

                              <h3 className="mt-2 text-2xl font-bold">
                                {idea.title}
                              </h3>
                            </div>

                            {sourceScore > 0 && (
                              <div className="rounded-xl bg-[#f5efe1] px-4 py-2 text-center">
                                <p className="font-bold">{sourceScore}/35</p>

                                <p className="text-[10px] uppercase text-black/40">
                                  Problem Score
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="mt-5 rounded-2xl bg-[#f5efe1] p-4">
                            <p className="text-xs font-bold uppercase text-black/40">
                              Problem
                            </p>

                            <p className="mt-2 font-bold">
                              {idea.problemTitle ||
                                sourceProblem?.title ||
                                "Not connected"}
                            </p>
                          </div>

                          <div className="mt-4 rounded-2xl bg-[#333333] p-5 text-white">
                            <p className="text-xs font-bold uppercase text-[#d8d4cb]">
                              The One Job
                            </p>

                            <p className="mt-2 text-lg font-bold">
                              {idea.oneJob || "Not defined yet"}
                            </p>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-[#f5efe1] p-4">
                              <p className="text-xs font-bold uppercase text-black/40">
                                User
                              </p>

                              <p className="mt-2 text-sm">{idea.targetUser}</p>
                            </div>

                            <div className="rounded-2xl bg-[#f5efe1] p-4">
                              <p className="text-xs font-bold uppercase text-black/40">
                                Current Workaround
                              </p>

                              <p className="mt-2 text-sm">
                                {idea.currentWorkaround}
                              </p>
                            </div>
                          </div>

                          {idea.whyUseful && (
                            <div className="mt-4">
                              <p className="text-xs font-bold uppercase text-black/40">
                                Why Useful
                              </p>

                              <p className="mt-2 text-sm leading-relaxed text-black/65">
                                {idea.whyUseful}
                              </p>
                            </div>
                          )}

                          {idea.versionOne && (
                            <div className="mt-4">
                              <p className="text-xs font-bold uppercase text-black/40">
                                Version 1
                              </p>

                              <p className="mt-2 text-sm leading-relaxed text-black/65">
                                {idea.versionOne}
                              </p>
                            </div>
                          )}

                          {idea.pricingThought && (
                            <div className="mt-4">
                              <p className="text-xs font-bold uppercase text-black/40">
                                Pricing Thought
                              </p>

                              <p className="mt-2 text-sm">
                                {idea.pricingThought}
                              </p>
                            </div>
                          )}

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              onClick={() => selectWinner(idea.id)}
                              className={`rounded-xl px-5 py-3 text-sm font-bold ${
                                selected
                                  ? "bg-[#7a1d1d] text-white"
                                  : "bg-[#333333] text-white"
                              }`}
                            >
                              {selected
                                ? "Winner Selected ✓"
                                : "Select as Winner"}
                            </button>

                            <button
                              onClick={() => deleteIdea(idea.id)}
                              className="text-sm font-bold text-black/40"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* WINNER HANDOFF */}
        <div
          className={`mt-8 rounded-3xl p-7 ${
            winnerIdea
              ? "border-2 border-[#7a1d1d] bg-white"
              : "bg-[#333333] text-white"
          }`}
        >
          <p
            className={`text-sm font-bold uppercase tracking-[0.16em] ${
              winnerIdea ? "text-[#7a1d1d]" : "text-[#d8d4cb]"
            }`}
          >
            Stage 1 Finish Line
          </p>

          {winnerIdea ? (
            <>
              <h2 className="mt-2 text-3xl font-bold">{winnerIdea.title}</h2>

              <p className="mt-3 max-w-3xl text-black/60">
                This is your selected winner. Industry Research is now ready to
                hand this idea into Stage 2.
              </p>

              <div className="mt-5 rounded-2xl bg-[#f5efe1] p-5">
                <p className="text-xs font-bold uppercase text-black/40">
                  One Job
                </p>

                <p className="mt-2 text-xl font-bold">{winnerIdea.oneJob}</p>
              </div>

              <button
                onClick={moveWinnerToDevelopIdea}
                className="mt-6 rounded-xl bg-[#7a1d1d] px-7 py-4 text-lg font-bold text-white"
              >
                Move Winner to Develop Idea →
              </button>

              {moveMessage && (
                <div className="mt-4 rounded-xl bg-[#f5efe1] p-4 font-bold text-[#7a1d1d]">
                  {moveMessage}

                  {moveMessage.includes("Stage 2") && (
                    <div className="mt-3">
                      <Link href="/research/develop-idea" className="underline">
                        Open Develop Idea →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="mt-2 text-3xl font-bold">Pick the winner.</h2>

              <p className="mt-3 max-w-3xl text-[#d8d4cb]">
                Research broadly, find the problems, rank the opportunities,
                generate several ideas — then send only the winner forward.
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="font-bold">
                  Industry → Research → Problems → Rank → Ideas → Winner →
                  Develop Idea
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
