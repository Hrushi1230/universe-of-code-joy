/**
 * Algora — Content Schema & Validation Module
 *
 * SPECIFICATION REFERENCE: S10.6 & Gate G10 (Content Integrity)
 * "S10.6 — Lesson content validates against its schema, and invalid content fails the build rather than rendering broken."
 *
 * Provides runtime and build-time Zod schemas for all content entities:
 * - Algorithms, Category metadata, Categories, Difficulties, VizKinds
 * - Lessons, LessonSections, QuizQuestions
 * - Problems, ProblemExamples, ProblemTests
 * - Guided Paths, PathModules
 * - Achievements, Quests, Marketing Claims, Demo Learner, Nav
 *
 * Also provides referential integrity verification and build-time assertion utilities.
 */

import { z } from "zod";
import type {
  Category,
  Difficulty,
  VizKind,
  Algorithm,
  Lesson,
  LessonSection,
  QuizQuestion,
  Problem,
  ProblemExample,
  ProblemTest,
  Path,
  PathModule,
  Achievement,
  Quest,
  LegalSubSection,
  LegalSection,
  LegalDocument,
} from "@/data/types";
import type {
  MarketingClaim,
  MarketingClaimStatus,
  MarketingClaimType,
} from "@/data/marketing-claims";
import type { DemoLearner, DailyActivity } from "./demo-learner";
import type { AppNavItem, SiteNavItem, SiteFooterCol, SettingsNavItem } from "./nav";

// ============================================================================
// 1. Primitive & Enum Schemas
// ============================================================================

export const CATEGORIES = [
  "arrays",
  "strings",
  "linked-lists",
  "stacks-queues",
  "trees",
  "heaps",
  "hashing",
  "graphs",
  "sorting",
  "searching",
  "greedy",
  "dp",
  "backtracking",
  "bit-manipulation",
  "math",
] as const;

export const CategorySchema = z.enum(CATEGORIES);

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const DifficultySchema = z.enum(DIFFICULTIES);

export const VIZ_KINDS = [
  "array",
  "tree",
  "graph",
  "grid",
  "table",
  "linked-list",
  "stack",
  "queue",
] as const;
export const VizKindSchema = z.enum(VIZ_KINDS);

export const SlugSchema = z
  .string()
  .min(1, "Slug cannot be empty")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with single hyphens");

// ============================================================================
// 2. Algorithm Schemas
// ============================================================================

export const CategoryMetaItemSchema = z.object({
  label: z.string().min(1, "Category label is required"),
  icon: z.string().min(1, "Category icon is required"),
  description: z.string().min(1, "Category description is required"),
});

export const CategoryMetaSchema = z.record(CategorySchema, CategoryMetaItemSchema);

export const AlgorithmSchema = z.object({
  slug: SlugSchema,
  name: z.string().min(1, "Algorithm name is required"),
  category: CategorySchema,
  difficulty: DifficultySchema,
  vizKind: VizKindSchema,
  oneLiner: z.string().min(1, "One-liner is required"),
  summary: z.string().min(1, "Summary is required"),
  timeBest: z.string().min(1, "timeBest is required"),
  timeAvg: z.string().min(1, "timeAvg is required"),
  timeWorst: z.string().min(1, "timeWorst is required"),
  space: z.string().min(1, "space complexity is required"),
  prerequisites: z.array(SlugSchema),
  tags: z.array(z.string().min(1, "Tag cannot be empty")),
  realWorldUses: z.array(z.string().min(1, "Use case cannot be empty")),
  commonMistakes: z.array(z.string().min(1, "Common mistake cannot be empty")),
  estMinutes: z.number().int().positive("estMinutes must be a positive integer"),
  xp: z.number().int().positive("xp must be a positive integer"),
  implementationProblemSlug: SlugSchema.optional(),
  transferProblemSlug: SlugSchema.optional(),
});

// ============================================================================
// 3. Lesson & Quiz Schemas
// ============================================================================

export const LessonSectionSchema = z.object({
  id: z.string().min(1, "Section ID is required"),
  heading: z.string().min(1, "Section heading is required"),
  markdown: z.string().min(1, "Section markdown cannot be empty"),
  visualStep: z.number().int().nonnegative().optional(),
});

export const QUIZ_KINDS = ["mcq", "predict-step", "order-steps", "true-false"] as const;
export const QuizKindSchema = z.enum(QUIZ_KINDS);

export const QuizQuestionSchema = z
  .object({
    id: z.string().min(1, "Quiz question ID is required"),
    kind: QuizKindSchema,
    prompt: z.string().min(1, "Quiz prompt cannot be empty"),
    options: z
      .array(z.string().min(1, "Option cannot be empty"))
      .min(2, "Quiz question must have at least 2 options"),
    answerIndex: z.union([
      z.number().int().nonnegative("answerIndex must be non-negative"),
      z
        .array(z.number().int().nonnegative("answerIndex must be non-negative"))
        .min(1, "Must have at least one answerIndex"),
    ]),
    explanation: z.string().min(1, "Quiz explanation cannot be empty"),
  })
  .refine(
    (q) => {
      if (typeof q.answerIndex === "number") {
        return q.answerIndex >= 0 && q.answerIndex < q.options.length;
      }
      return q.answerIndex.every((idx) => idx >= 0 && idx < q.options.length);
    },
    {
      message: "answerIndex must reference valid indices within options array",
      path: ["answerIndex"],
    },
  );

export const LessonSchema = z.object({
  slug: SlugSchema,
  algorithmSlug: SlugSchema,
  title: z.string().min(1, "Lesson title is required"),
  estMinutes: z.number().int().positive("estMinutes must be a positive integer"),
  xp: z.number().int().positive("xp must be a positive integer"),
  sections: z.array(LessonSectionSchema).min(1, "Lesson must contain at least 1 section"),
  quiz: z.array(QuizQuestionSchema),
});

// ============================================================================
// 4. Problem & Coding Challenge Schemas
// ============================================================================

export const ProblemExampleSchema = z.object({
  input: z.string().min(1, "Example input is required"),
  output: z.string().min(1, "Example output is required"),
  explanation: z.string().optional(),
});

export const ProblemTestSchema = z.object({
  id: z.string().min(1, "Test ID is required"),
  input: z.array(z.unknown()),
  expected: z.unknown(),
  hidden: z.boolean(),
});

export const StarterCodeSchema = z.object({
  js: z.string().min(1, "JavaScript starter code is required"),
  ts: z.string().min(1, "TypeScript starter code is required"),
  py: z.string().min(1, "Python starter code is required"),
});

export const IoCodecSchema = z.enum(["raw", "list", "list-cycle", "tree", "tree-node", "tree-val"]);

export const ProblemIoSchema = z.object({
  args: z.array(IoCodecSchema),
  returns: IoCodecSchema,
});

export const ProblemSchema = z.object({
  slug: SlugSchema,
  algorithmSlug: SlugSchema,
  title: z.string().min(1, "Problem title is required"),
  difficulty: DifficultySchema,
  statementMarkdown: z.string().min(1, "Problem statement markdown is required"),
  constraints: z.array(z.string().min(1, "Constraint cannot be empty")),
  examples: z.array(ProblemExampleSchema).min(1, "Problem must contain at least 1 example"),
  starterCode: StarterCodeSchema,
  tests: z.array(ProblemTestSchema),
  hints: z.array(z.string().min(1, "Hint cannot be empty")),
  xp: z.number().int().positive("xp must be a positive integer"),
  io: ProblemIoSchema.optional(),
  oneLiner: z.string().min(1, "oneLiner cannot be empty when present").optional(),
  estMinutes: z
    .number()
    .int()
    .positive("estMinutes must be a positive integer when present")
    .optional(),
});

// ============================================================================
// 5. Path Schemas
// ============================================================================

export const PathModuleSchema = z.object({
  title: z.string().min(1, "Module title is required"),
  itemSlugs: z.array(SlugSchema).min(1, "Module must contain at least 1 item slug"),
});

export const PathSchema = z.object({
  slug: SlugSchema,
  title: z.string().min(1, "Path title is required"),
  subtitle: z.string().min(1, "Path subtitle is required"),
  weeks: z.number().int().positive("Path weeks must be positive"),
  audience: z.string().min(1, "Path audience is required"),
  outcomes: z
    .array(z.string().min(1, "Outcome cannot be empty"))
    .min(1, "Path must have at least 1 outcome"),
  modules: z.array(PathModuleSchema).min(1, "Path must have at least 1 module"),
});

// ============================================================================
// 6. Achievement & Quest Schemas
// ============================================================================

export const ACHIEVEMENT_TIERS = ["bronze", "silver", "gold", "platinum"] as const;
export const AchievementTierSchema = z.enum(ACHIEVEMENT_TIERS);

export const AchievementSchema = z.object({
  id: SlugSchema,
  name: z.string().min(1, "Achievement name is required"),
  description: z.string().min(1, "Achievement description is required"),
  icon: z.string().min(1, "Achievement icon is required"),
  tier: AchievementTierSchema,
  xp: z.number().int().positive("Achievement xp must be positive"),
  criteria: z.string().min(1, "Achievement criteria is required"),
});

export const QUEST_KINDS = ["daily", "weekly"] as const;
export const QuestKindSchema = z.enum(QUEST_KINDS);

export const QuestSchema = z.object({
  id: SlugSchema,
  title: z.string().min(1, "Quest title is required"),
  description: z.string().min(1, "Quest description is required"),
  kind: QuestKindSchema,
  target: z.number().int().positive("Quest target must be positive"),
  xp: z.number().int().positive("Quest xp must be positive"),
  icon: z.string().min(1, "Quest icon is required"),
});

// ============================================================================
// 7. Marketing Claim Schemas
// ============================================================================

export const MARKETING_CLAIM_TYPES = [
  "metric",
  "social_proof",
  "outcome",
  "testimonial",
  "cohort_demo",
  "catalog_size",
] as const;
export const MarketingClaimTypeSchema = z.enum(MARKETING_CLAIM_TYPES);

export const MARKETING_CLAIM_STATUSES = ["UNVERIFIED", "SUBSTANTIATED", "RETIRED"] as const;
export const MarketingClaimStatusSchema = z.enum(MARKETING_CLAIM_STATUSES);

export const BaseMarketingClaimSchema = z.object({
  id: SlugSchema,
  type: MarketingClaimTypeSchema,
  status: MarketingClaimStatusSchema,
  surfaces: z.array(z.string().min(1)),
  flagReason: z.string(),
  targetResolution: z.string(),
  evidence: z.string(),
  substantiationMethod: z.string(),
  reviewedAt: z.string(),
  reviewedBy: z.string(),
});

export const MetricMarketingClaimSchema = BaseMarketingClaimSchema.extend({
  type: z.literal("metric"),
  value: z.string(),
  label: z.string().optional(),
  rawText: z.string(),
});

export const CatalogSizeMarketingClaimSchema = BaseMarketingClaimSchema.extend({
  type: z.literal("catalog_size"),
  value: z.string(),
  label: z.string().optional(),
  rawText: z.string(),
});

export const OutcomeMarketingClaimSchema = BaseMarketingClaimSchema.extend({
  type: z.literal("outcome"),
  value: z.string(),
  label: z.string(),
  subtext: z.string().optional(),
});

export const TestimonialMarketingClaimSchema = BaseMarketingClaimSchema.extend({
  type: z.literal("testimonial"),
  quote: z.string().min(1),
  author: z.string().min(1),
  role: z.string().min(1),
  initials: z.string().min(1),
});

export const CohortStudentSchema = z.object({
  initials: z.string().min(1),
  name: z.string().min(1),
  xp: z.string().min(1),
  mastery: z.number().min(0).max(100),
});

export const CohortDemoMarketingClaimSchema = BaseMarketingClaimSchema.extend({
  type: z.literal("cohort_demo"),
  courseCode: z.string().min(1),
  term: z.string().min(1),
  studentCount: z.number().int().positive(),
  avgMastery: z.number().min(0).max(100),
  roster: z.array(CohortStudentSchema),
});

export const InstitutionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fullName: z.string().min(1),
});

export const SocialProofMarketingClaimSchema = BaseMarketingClaimSchema.extend({
  type: z.literal("social_proof"),
  label: z.string().min(1),
  institutions: z.array(InstitutionSchema),
});

export const MarketingClaimSchema = z.discriminatedUnion("type", [
  MetricMarketingClaimSchema,
  CatalogSizeMarketingClaimSchema,
  OutcomeMarketingClaimSchema,
  TestimonialMarketingClaimSchema,
  CohortDemoMarketingClaimSchema,
  SocialProofMarketingClaimSchema,
]);

// ============================================================================
// 8. Demo Learner & Navigation Schemas
// ============================================================================

export const DailyActivitySchema = z.object({
  date: z.string().min(1, "Activity date is required"),
  xpEarned: z.number().int().nonnegative("xpEarned must be >= 0"),
  lessonsCompleted: z.number().int().nonnegative("lessonsCompleted must be >= 0"),
  problemsSolved: z.number().int().nonnegative("problemsSolved must be >= 0"),
  minutesActive: z.number().int().nonnegative("minutesActive must be >= 0"),
});

export const DemoLearnerSchema = z.object({
  handle: z.string().min(1, "Learner handle is required"),
  name: z.string().min(1, "Learner name is required"),
  level: z.number().int().positive("level must be positive"),
  xp: z.number().int().nonnegative("xp must be >= 0"),
  xpToNextLevel: z.number().int().positive("xpToNextLevel must be positive"),
  streak: z.number().int().nonnegative("streak must be >= 0"),
  longestStreak: z.number().int().nonnegative("longestStreak must be >= 0"),
  joinedAt: z.string().min(1, "joinedAt is required"),
  mastery: z.record(CategorySchema, z.number().min(0).max(100)),
  achievementIds: z.array(z.string().min(1)),
  activity: z.array(DailyActivitySchema),
});

export const AppNavItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  title: z.string().min(1),
  detail: z.string(),
  icon: z.any(),
  to: z.string().min(1),
  inSidebar: z.boolean(),
});

export const SiteNavItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  to: z.string().min(1),
});

export const SiteFooterColSchema = z.object({
  title: z.string().min(1),
  links: z.array(SiteNavItemSchema),
});

export const SettingsNavItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  icon: z.any(),
  to: z.string().min(1),
});

// ============================================================================
// 8.5 Legal Document Schemas (S10.7, S6.7)
// ============================================================================

export const LegalSubSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  contentMarkdown: z.string().min(10),
});

export const LegalSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional(),
  contentMarkdown: z.string().min(10),
  subsections: z.array(LegalSubSectionSchema).optional(),
});

export const LegalDocumentSchema = z.object({
  id: z.enum(["privacy", "terms"]),
  title: z.string().min(3),
  subtitle: z.string().min(5),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  summaryMarkdown: z.string().min(20),
  sections: z.array(LegalSectionSchema).min(5),
});

// ============================================================================
// 9. Catalog Validation & Referential Integrity
// ============================================================================

export interface ContentCatalog {
  algorithms: Algorithm[];
  lessons: Lesson[];
  problems: Problem[];
  paths: Path[];
  achievements: Achievement[];
  quests: Quest[];
  legalDocuments?: LegalDocument[];
  marketingClaims?: MarketingClaim[];
  categoryMeta?: Record<Category, { label: string; icon: string; description: string }>;
  demoLearner?: DemoLearner;
  appNav?: AppNavItem[];
  siteNav?: SiteNavItem[];
  siteFooterNav?: SiteFooterCol[];
  settingsNav?: SettingsNavItem[];
}

export interface ValidationErrorDetail {
  entityType: string;
  idOrSlug: string;
  fieldPath: string;
  message: string;
}

export interface CatalogValidationResult {
  success: boolean;
  errors: ValidationErrorDetail[];
  counts: {
    algorithms: number;
    lessons: number;
    problems: number;
    paths: number;
    achievements: number;
    quests: number;
    legalDocuments: number;
    marketingClaims: number;
  };
}

/**
 * Validates an entire content catalog against schemas and checks referential integrity.
 */
export function validateCatalog(catalog: ContentCatalog): CatalogValidationResult {
  const errors: ValidationErrorDetail[] = [];

  const algorithmMap = new Map<string, Algorithm>();
  const lessonMap = new Map<string, Lesson>();
  const problemMap = new Map<string, Problem>();
  const pathMap = new Map<string, Path>();
  const achievementMap = new Map<string, Achievement>();
  const questMap = new Map<string, Quest>();
  const claimMap = new Map<string, MarketingClaim>();

  // 1. Validate Algorithms
  for (const algo of catalog.algorithms) {
    const result = AlgorithmSchema.safeParse(algo);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          entityType: "Algorithm",
          idOrSlug: algo?.slug ?? "unknown",
          fieldPath: issue.path.join("."),
          message: issue.message,
        });
      }
    }
    if (algo?.slug) {
      if (algorithmMap.has(algo.slug)) {
        errors.push({
          entityType: "Algorithm",
          idOrSlug: algo.slug,
          fieldPath: "slug",
          message: `Duplicate algorithm slug "${algo.slug}"`,
        });
      }
      algorithmMap.set(algo.slug, algo);
    }
  }

  // 2. Validate Lessons
  for (const lesson of catalog.lessons) {
    const result = LessonSchema.safeParse(lesson);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          entityType: "Lesson",
          idOrSlug: lesson?.slug ?? "unknown",
          fieldPath: issue.path.join("."),
          message: issue.message,
        });
      }
    }
    if (lesson?.slug) {
      if (lessonMap.has(lesson.slug)) {
        errors.push({
          entityType: "Lesson",
          idOrSlug: lesson.slug,
          fieldPath: "slug",
          message: `Duplicate lesson slug "${lesson.slug}"`,
        });
      }
      lessonMap.set(lesson.slug, lesson);
    }

    // Referential integrity: algorithmSlug must exist
    if (lesson?.algorithmSlug && !algorithmMap.has(lesson.algorithmSlug)) {
      errors.push({
        entityType: "Lesson",
        idOrSlug: lesson.slug,
        fieldPath: "algorithmSlug",
        message: `Foreign key violation: algorithmSlug "${lesson.algorithmSlug}" does not exist in algorithms`,
      });
    }
  }

  // 3. Validate Problems
  for (const prob of catalog.problems) {
    const result = ProblemSchema.safeParse(prob);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          entityType: "Problem",
          idOrSlug: prob?.slug ?? "unknown",
          fieldPath: issue.path.join("."),
          message: issue.message,
        });
      }
    }
    if (prob?.slug) {
      if (problemMap.has(prob.slug)) {
        errors.push({
          entityType: "Problem",
          idOrSlug: prob.slug,
          fieldPath: "slug",
          message: `Duplicate problem slug "${prob.slug}"`,
        });
      }
      problemMap.set(prob.slug, prob);
    }

    // Referential integrity: algorithmSlug must exist
    if (prob?.algorithmSlug && !algorithmMap.has(prob.algorithmSlug)) {
      errors.push({
        entityType: "Problem",
        idOrSlug: prob.slug,
        fieldPath: "algorithmSlug",
        message: `Foreign key violation: algorithmSlug "${prob.algorithmSlug}" does not exist in algorithms`,
      });
    }
  }

  // 4. Validate Paths
  for (const path of catalog.paths) {
    const result = PathSchema.safeParse(path);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          entityType: "Path",
          idOrSlug: path?.slug ?? "unknown",
          fieldPath: issue.path.join("."),
          message: issue.message,
        });
      }
    }
    if (path?.slug) {
      if (pathMap.has(path.slug)) {
        errors.push({
          entityType: "Path",
          idOrSlug: path.slug,
          fieldPath: "slug",
          message: `Duplicate path slug "${path.slug}"`,
        });
      }
      pathMap.set(path.slug, path);
    }

    // Referential integrity: module itemSlugs must exist in algorithms, problems, or lessons
    for (let mIdx = 0; mIdx < (path?.modules?.length ?? 0); mIdx++) {
      const mod = path.modules[mIdx];
      for (let sIdx = 0; sIdx < (mod?.itemSlugs?.length ?? 0); sIdx++) {
        const itemSlug = mod.itemSlugs[sIdx];
        const exists =
          algorithmMap.has(itemSlug) || problemMap.has(itemSlug) || lessonMap.has(itemSlug);
        if (!exists) {
          errors.push({
            entityType: "Path",
            idOrSlug: path.slug,
            fieldPath: `modules[${mIdx}].itemSlugs[${sIdx}]`,
            message: `Foreign key violation: itemSlug "${itemSlug}" in module "${mod.title}" does not exist in algorithms, problems, or lessons`,
          });
        }
      }
    }
  }

  // 5. Validate Achievements
  for (const ach of catalog.achievements) {
    const result = AchievementSchema.safeParse(ach);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          entityType: "Achievement",
          idOrSlug: ach?.id ?? "unknown",
          fieldPath: issue.path.join("."),
          message: issue.message,
        });
      }
    }
    if (ach?.id) {
      if (achievementMap.has(ach.id)) {
        errors.push({
          entityType: "Achievement",
          idOrSlug: ach.id,
          fieldPath: "id",
          message: `Duplicate achievement ID "${ach.id}"`,
        });
      }
      achievementMap.set(ach.id, ach);
    }
  }

  // 6. Validate Quests
  for (const quest of catalog.quests) {
    const result = QuestSchema.safeParse(quest);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          entityType: "Quest",
          idOrSlug: quest?.id ?? "unknown",
          fieldPath: issue.path.join("."),
          message: issue.message,
        });
      }
    }
    if (quest?.id) {
      if (questMap.has(quest.id)) {
        errors.push({
          entityType: "Quest",
          idOrSlug: quest.id,
          fieldPath: "id",
          message: `Duplicate quest ID "${quest.id}"`,
        });
      }
      questMap.set(quest.id, quest);
    }
  }

  // 7. Validate Marketing Claims (if provided)
  if (catalog.marketingClaims) {
    for (const claim of catalog.marketingClaims) {
      const result = MarketingClaimSchema.safeParse(claim);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            entityType: "MarketingClaim",
            idOrSlug: claim?.id ?? "unknown",
            fieldPath: issue.path.join("."),
            message: issue.message,
          });
        }
      }
      if (claim?.id) {
        if (claimMap.has(claim.id)) {
          errors.push({
            entityType: "MarketingClaim",
            idOrSlug: claim.id,
            fieldPath: "id",
            message: `Duplicate marketing claim ID "${claim.id}"`,
          });
        }
        claimMap.set(claim.id, claim);
      }
    }
  }

  // 8. Validate Category Meta (if provided)
  if (catalog.categoryMeta) {
    const result = CategoryMetaSchema.safeParse(catalog.categoryMeta);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          entityType: "CategoryMeta",
          idOrSlug: "categoryMeta",
          fieldPath: issue.path.join("."),
          message: issue.message,
        });
      }
    }
  }

  // 9. Validate Demo Learner (if provided)
  if (catalog.demoLearner) {
    const result = DemoLearnerSchema.safeParse(catalog.demoLearner);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          entityType: "DemoLearner",
          idOrSlug: catalog.demoLearner.handle ?? "unknown",
          fieldPath: issue.path.join("."),
          message: issue.message,
        });
      }
    }
  }

  // 10. Check Algorithm Prerequisites
  for (const algo of catalog.algorithms) {
    for (const prereq of algo?.prerequisites ?? []) {
      if (!algorithmMap.has(prereq)) {
        errors.push({
          entityType: "Algorithm",
          idOrSlug: algo.slug,
          fieldPath: "prerequisites",
          message: `Foreign key violation: prerequisite "${prereq}" not found in algorithms`,
        });
      }
    }
  }

  // 11. Validate Legal Documents (S10.7 & S6.7)
  const placeholderRegex = /\b(lorem\s+ipsum|placeholder|\[insert\s+|\[company\s+|TODO|TBD)\b/i;
  for (const doc of catalog.legalDocuments ?? []) {
    const result = LegalDocumentSchema.safeParse(doc);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          entityType: "LegalDocument",
          idOrSlug: doc?.id ?? "unknown",
          fieldPath: issue.path.join("."),
          message: issue.message,
        });
      }
    }

    // Assert zero-placeholder policy (S10.7)
    if (doc?.summaryMarkdown && placeholderRegex.test(doc.summaryMarkdown)) {
      errors.push({
        entityType: "LegalDocument",
        idOrSlug: doc.id,
        fieldPath: "summaryMarkdown",
        message: `Placeholder text forbidden in legal documents (S10.7)`,
      });
    }

    for (let sIdx = 0; sIdx < (doc?.sections?.length ?? 0); sIdx++) {
      const sec = doc.sections[sIdx];
      if (sec?.contentMarkdown && placeholderRegex.test(sec.contentMarkdown)) {
        errors.push({
          entityType: "LegalDocument",
          idOrSlug: doc.id,
          fieldPath: `sections[${sIdx}].contentMarkdown`,
          message: `Placeholder text forbidden in legal documents (S10.7)`,
        });
      }
    }
  }

  return {
    success: errors.length === 0,
    errors,
    counts: {
      algorithms: catalog.algorithms.length,
      lessons: catalog.lessons.length,
      problems: catalog.problems.length,
      paths: catalog.paths.length,
      achievements: catalog.achievements.length,
      quests: catalog.quests.length,
      legalDocuments: catalog.legalDocuments?.length ?? 0,
      marketingClaims: catalog.marketingClaims?.length ?? 0,
    },
  };
}

export class ContentValidationError extends Error {
  readonly details: ValidationErrorDetail[];

  constructor(details: ValidationErrorDetail[]) {
    const formatted = details
      .map(
        (d, idx) => `  ${idx + 1}. [${d.entityType}:${d.idOrSlug}] ${d.fieldPath} — ${d.message}`,
      )
      .join("\n");
    super(`Content schema validation failed with ${details.length} error(s):\n${formatted}`);
    this.name = "ContentValidationError";
    this.details = details;
  }
}

/**
 * Validates a catalog or throws a ContentValidationError if any check fails.
 */
export function assertValidContent(catalog: ContentCatalog): CatalogValidationResult {
  const result = validateCatalog(catalog);
  if (!result.success) {
    throw new ContentValidationError(result.errors);
  }
  return result;
}

// Single-entity helper validators
export function validateAlgorithm(algo: unknown): {
  success: boolean;
  data?: Algorithm;
  error?: z.ZodError;
} {
  const parsed = AlgorithmSchema.safeParse(algo);
  return parsed.success
    ? { success: true, data: parsed.data as Algorithm }
    : { success: false, error: parsed.error };
}

export function validateLesson(lesson: unknown): {
  success: boolean;
  data?: Lesson;
  error?: z.ZodError;
} {
  const parsed = LessonSchema.safeParse(lesson);
  return parsed.success
    ? { success: true, data: parsed.data as Lesson }
    : { success: false, error: parsed.error };
}

export function validateProblem(problem: unknown): {
  success: boolean;
  data?: Problem;
  error?: z.ZodError;
} {
  const parsed = ProblemSchema.safeParse(problem);
  return parsed.success
    ? { success: true, data: parsed.data as Problem }
    : { success: false, error: parsed.error };
}

export function validatePath(path: unknown): { success: boolean; data?: Path; error?: z.ZodError } {
  const parsed = PathSchema.safeParse(path);
  return parsed.success
    ? { success: true, data: parsed.data as Path }
    : { success: false, error: parsed.error };
}

export function validateAchievement(ach: unknown): {
  success: boolean;
  data?: Achievement;
  error?: z.ZodError;
} {
  const parsed = AchievementSchema.safeParse(ach);
  return parsed.success
    ? { success: true, data: parsed.data as Achievement }
    : { success: false, error: parsed.error };
}

export function validateQuest(quest: unknown): {
  success: boolean;
  data?: Quest;
  error?: z.ZodError;
} {
  const parsed = QuestSchema.safeParse(quest);
  return parsed.success
    ? { success: true, data: parsed.data as Quest }
    : { success: false, error: parsed.error };
}

export function validateMarketingClaim(claim: unknown): {
  success: boolean;
  data?: MarketingClaim;
  error?: z.ZodError;
} {
  const parsed = MarketingClaimSchema.safeParse(claim);
  return parsed.success
    ? { success: true, data: parsed.data as MarketingClaim }
    : { success: false, error: parsed.error };
}

// ============================================================================
// Review item schemas (active recall)
// ============================================================================

export const REVIEW_ITEM_KINDS = [
  "concept",
  "boundary",
  "classification",
  "invariant",
  "midpoint",
  "termination",
  "code",
  "pattern",
] as const;
export const ReviewItemKindSchema = z.enum(REVIEW_ITEM_KINDS);

export const ReviewChoiceSchema = z.object({
  id: z.string().min(1, "Choice id is required"),
  label: z.string().min(1, "Choice label is required"),
  misconception: z.string().min(1, "misconception cannot be empty when present").optional(),
});

export const ReviewItemSchema = z
  .object({
    id: z.string().min(1, "Review item id is required"),
    algorithmSlug: SlugSchema,
    problemSlug: SlugSchema.optional(),
    kind: ReviewItemKindSchema,
    prompt: z.string().min(1, "Review prompt is required"),
    given: z.array(z.string().min(1, "Given line cannot be empty")),
    choices: z.array(ReviewChoiceSchema).min(2, "A review item needs at least 2 choices"),
    answerId: z.string().min(1, "answerId is required"),
    explanation: z.string().min(1, "Review explanation is required"),
    hint: z.string().min(1, "hint cannot be empty when present").optional(),
  })
  .refine((item) => item.choices.some((c) => c.id === item.answerId), {
    message: "answerId must match one of the choices",
    path: ["answerId"],
  })
  .refine((item) => new Set(item.choices.map((c) => c.id)).size === item.choices.length, {
    message: "Choice ids must be unique",
    path: ["choices"],
  })
  .refine((item) => item.choices.every((c) => (c.id === item.answerId) === !c.misconception), {
    message: "Every distractor needs a misconception, and the correct choice must not have one",
    path: ["choices"],
  });

export function validateReviewItem(item: unknown): {
  success: boolean;
  error?: z.ZodError;
} {
  const parsed = ReviewItemSchema.safeParse(item);
  return parsed.success ? { success: true } : { success: false, error: parsed.error };
}
