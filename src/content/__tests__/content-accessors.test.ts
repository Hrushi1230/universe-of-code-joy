import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  fetchAchievement,
  fetchAchievements,
  fetchAchievementsByTier,
  fetchAlgorithm,
  fetchAlgorithms,
  fetchAlgorithmsByCategory,
  fetchAlgorithmsByDifficulty,
  fetchAppNav,
  fetchCategoryMeta,
  fetchDemoLearner,
  fetchLesson,
  fetchLessonByAlgorithm,
  fetchLessons,
  fetchLessonsByAlgorithm,
  fetchMarketingClaim,
  fetchMarketingClaims,
  fetchPath,
  fetchPaths,
  fetchProblem,
  fetchProblems,
  fetchProblemsByAlgorithm,
  fetchProblemsByDifficulty,
  fetchQuest,
  fetchQuests,
  fetchQuestsByKind,
  fetchSettingsNav,
  fetchSiteNav,
  getAchievement,
  getAchievements,
  getAchievementsByTier,
  getAlgorithm,
  getAlgorithms,
  getAlgorithmsByCategory,
  getAlgorithmsByDifficulty,
  getAppNav,
  getCategoryMeta,
  getContentClient,
  getDemoLearner,
  getLesson,
  getLessonByAlgorithm,
  getLessons,
  getLessonsByAlgorithm,
  getMarketingClaim,
  getMarketingClaims,
  getPath,
  getPaths,
  getProblem,
  getProblems,
  getProblemsByAlgorithm,
  getProblemsByDifficulty,
  getQuest,
  getQuests,
  getQuestsByKind,
  getSettingsNav,
  getSiteNav,
  resetContentClient,
  setContentClient,
  StaticContentClient,
  type ContentClient,
} from "@/content";

describe("Content Accessors & Seam 1 Client Architecture (S10.2)", () => {
  beforeEach(() => {
    resetContentClient();
  });

  afterEach(() => {
    resetContentClient();
  });

  describe("1. StaticContentClient direct access", () => {
    const client = new StaticContentClient();

    it("retrieves algorithms and filters correctly", async () => {
      const all = await client.getAlgorithms();
      expect(all.length).toBeGreaterThan(0);

      const first = all[0];
      const bySlug = await client.getAlgorithm(first.slug);
      expect(bySlug).toEqual(first);

      const notFound = await client.getAlgorithm("non-existent-algo-slug");
      expect(notFound).toBeNull();

      const easy = await client.getAlgorithmsByDifficulty("easy");
      expect(easy.every((a) => a.difficulty === "easy")).toBe(true);

      const byCat = await client.getAlgorithmsByCategory();
      expect(byCat.sorting).toBeDefined();

      const meta = await client.getCategoryMeta();
      expect(meta.sorting.label).toBeDefined();
    });

    it("retrieves lessons and links correctly", async () => {
      const all = await client.getLessons();
      expect(all.length).toBeGreaterThan(0);

      const first = all[0];
      const bySlug = await client.getLesson(first.slug);
      expect(bySlug).toEqual(first);

      const notFound = await client.getLesson("non-existent-lesson-slug");
      expect(notFound).toBeNull();

      const byAlgo = await client.getLessonByAlgorithm(first.algorithmSlug);
      expect(byAlgo).toBeDefined();

      const allByAlgo = await client.getLessonsByAlgorithm(first.algorithmSlug);
      expect(allByAlgo.length).toBeGreaterThanOrEqual(1);
    });

    it("retrieves problems and filters correctly", async () => {
      const all = await client.getProblems();
      expect(all.length).toBeGreaterThan(0);

      const first = all[0];
      const bySlug = await client.getProblem(first.slug);
      expect(bySlug).toEqual(first);

      const notFound = await client.getProblem("non-existent-problem");
      expect(notFound).toBeNull();

      const byAlgo = await client.getProblemsByAlgorithm(first.algorithmSlug);
      expect(byAlgo.length).toBeGreaterThanOrEqual(1);

      const easy = await client.getProblemsByDifficulty("easy");
      expect(easy.every((p) => p.difficulty === "easy")).toBe(true);
    });

    it("retrieves guided paths correctly", async () => {
      const all = await client.getPaths();
      expect(all.length).toBeGreaterThan(0);

      const first = all[0];
      const bySlug = await client.getPath(first.slug);
      expect(bySlug).toEqual(first);

      const notFound = await client.getPath("non-existent-path");
      expect(notFound).toBeNull();
    });

    it("retrieves quests and filters correctly", async () => {
      const all = await client.getQuests();
      expect(all.length).toBeGreaterThan(0);

      const first = all[0];
      const byId = await client.getQuest(first.id);
      expect(byId).toEqual(first);

      const notFound = await client.getQuest("non-existent-quest");
      expect(notFound).toBeNull();

      const daily = await client.getQuestsByKind("daily");
      expect(daily.every((q) => q.kind === "daily")).toBe(true);
    });

    it("retrieves achievements and filters correctly", async () => {
      const all = await client.getAchievements();
      expect(all.length).toBeGreaterThan(0);

      const first = all[0];
      const byId = await client.getAchievement(first.id);
      expect(byId).toEqual(first);

      const notFound = await client.getAchievement("non-existent-achievement");
      expect(notFound).toBeNull();

      const bronze = await client.getAchievementsByTier("bronze");
      expect(bronze.every((a) => a.tier === "bronze")).toBe(true);
    });

    it("retrieves demo learner profile correctly", async () => {
      const learner = await client.getDemoLearner();
      expect(learner.handle).toBe("local_learner");
      expect(learner.streak).toBeGreaterThan(0);
      expect(learner.activity.length).toBeGreaterThan(0);
    });

    it("retrieves marketing claims correctly", async () => {
      const claims = await client.getMarketingClaims();
      expect(claims.length).toBeGreaterThan(0);

      const first = claims[0];
      const byId = await client.getMarketingClaim(first.id);
      expect(byId).toEqual(first);

      const notFound = await client.getMarketingClaim("non-existent-claim");
      expect(notFound).toBeNull();
    });

    it("retrieves navigation items correctly", async () => {
      const appNav = await client.getAppNav();
      expect(appNav.length).toBeGreaterThan(0);

      const siteNav = await client.getSiteNav();
      expect(siteNav.length).toBeGreaterThan(0);

      const settingsNav = await client.getSettingsNav();
      expect(settingsNav.length).toBeGreaterThan(0);
    });
  });

  describe("2. Defensive Shallow Cloning in StaticContentClient", () => {
    it("mutating arrays returned by StaticContentClient does not corrupt original data", async () => {
      const client = new StaticContentClient();

      const algos1 = await client.getAlgorithms();
      const initialLength = algos1.length;
      algos1.pop();
      expect(algos1.length).toBe(initialLength - 1);

      const algos2 = await client.getAlgorithms();
      expect(algos2.length).toBe(initialLength);

      const paths1 = await client.getPaths();
      const pathLength = paths1.length;
      paths1.push({} as unknown as (typeof paths1)[0]);
      expect(paths1.length).toBe(pathLength + 1);

      const paths2 = await client.getPaths();
      expect(paths2.length).toBe(pathLength);
    });

    it("mutating demoLearner returned by StaticContentClient does not corrupt original profile", async () => {
      const client = new StaticContentClient();
      const profile1 = await client.getDemoLearner();
      const originalStreak = profile1.streak;

      profile1.streak = 99999;
      profile1.activity.pop();

      const profile2 = await client.getDemoLearner();
      expect(profile2.streak).toBe(originalStreak);
      expect(profile2.activity.length).toBeGreaterThan(0);
    });
  });

  describe("3. Client Lifecycle & Swapping Support (Seam 1)", () => {
    it("delegates to a custom mock client when setContentClient is called", async () => {
      const baseAlgo = getAlgorithm("two-pointers")!;
      const mockClient: ContentClient = {
        getAlgorithm: async (slug: string) => ({
          ...baseAlgo,
          slug,
          name: "Mock Algorithm",
        }),
        getAlgorithms: async () => [],
        getAlgorithmsByCategory: async () =>
          ({}) as unknown as ReturnType<ContentClient["getAlgorithmsByCategory"]>,
        getCategoryMeta: async () =>
          ({}) as unknown as ReturnType<ContentClient["getCategoryMeta"]>,
        getAlgorithmsByDifficulty: async () => [],
        getLesson: async () => null,
        getLessons: async () => [],
        getLessonByAlgorithm: async () => null,
        getLessonsByAlgorithm: async () => [],
        getProblem: async () => null,
        getProblems: async () => [],
        getProblemsByAlgorithm: async () => [],
        getProblemsByDifficulty: async () => [],
        getPath: async () => null,
        getPaths: async () => [],
        getQuest: async () => null,
        getQuests: async () => [],
        getQuestsByKind: async () => [],
        getAchievement: async () => null,
        getAchievements: async () => [],
        getAchievementsByTier: async () => [],
        getDemoLearner: async () => ({}) as unknown as ReturnType<ContentClient["getDemoLearner"]>,
        getMarketingClaim: async () => null,
        getMarketingClaims: async () => [],
        getAppNav: async () => [],
        getSiteNav: async () => [],
        getSettingsNav: async () => [],
        getLegalDocument: async () => null,
        getLegalDocuments: async () => [],
      };

      setContentClient(mockClient);
      expect(getContentClient()).toBe(mockClient);

      const algo = await fetchAlgorithm("any-algo");
      expect(algo?.name).toBe("Mock Algorithm");

      resetContentClient();
      expect(getContentClient()).toBeInstanceOf(StaticContentClient);

      const realAlgo = await fetchAlgorithm("two-pointers");
      expect(realAlgo?.name).not.toBe("Mock Algorithm");
    });
  });

  describe("4. Top-level Asynchronous Content Helpers (fetch*)", () => {
    it("fetchAlgorithms and fetchAlgorithm work seamlessly", async () => {
      const algos = await fetchAlgorithms();
      expect(algos.length).toBeGreaterThan(0);

      const algo = await fetchAlgorithm(algos[0].slug);
      expect(algo?.slug).toBe(algos[0].slug);

      const byCat = await fetchAlgorithmsByCategory();
      expect(byCat.arrays).toBeDefined();

      const meta = await fetchCategoryMeta();
      expect(meta.arrays).toBeDefined();

      const diff = await fetchAlgorithmsByDifficulty("medium");
      expect(diff.every((a) => a.difficulty === "medium")).toBe(true);
    });

    it("fetchLessons and fetchLesson work seamlessly", async () => {
      const lessons = await fetchLessons();
      expect(lessons.length).toBeGreaterThan(0);

      const lesson = await fetchLesson(lessons[0].slug);
      expect(lesson?.slug).toBe(lessons[0].slug);

      const byAlgo = await fetchLessonByAlgorithm(lessons[0].algorithmSlug);
      expect(byAlgo).toBeDefined();

      const allByAlgo = await fetchLessonsByAlgorithm(lessons[0].algorithmSlug);
      expect(allByAlgo.length).toBeGreaterThanOrEqual(1);
    });

    it("fetchProblems and fetchProblem work seamlessly", async () => {
      const problems = await fetchProblems();
      expect(problems.length).toBeGreaterThan(0);

      const problem = await fetchProblem(problems[0].slug);
      expect(problem?.slug).toBe(problems[0].slug);

      const byAlgo = await fetchProblemsByAlgorithm(problems[0].algorithmSlug);
      expect(byAlgo.length).toBeGreaterThanOrEqual(1);

      const easy = await fetchProblemsByDifficulty("easy");
      expect(easy.every((p) => p.difficulty === "easy")).toBe(true);
    });

    it("fetchPaths and fetchPath work seamlessly", async () => {
      const paths = await fetchPaths();
      expect(paths.length).toBeGreaterThan(0);

      const path = await fetchPath(paths[0].slug);
      expect(path?.slug).toBe(paths[0].slug);
    });

    it("fetchQuests and fetchQuest work seamlessly", async () => {
      const quests = await fetchQuests();
      expect(quests.length).toBeGreaterThan(0);

      const quest = await fetchQuest(quests[0].id);
      expect(quest?.id).toBe(quests[0].id);

      const daily = await fetchQuestsByKind("daily");
      expect(daily.every((q) => q.kind === "daily")).toBe(true);
    });

    it("fetchAchievements and fetchAchievement work seamlessly", async () => {
      const achievements = await fetchAchievements();
      expect(achievements.length).toBeGreaterThan(0);

      const achievement = await fetchAchievement(achievements[0].id);
      expect(achievement?.id).toBe(achievements[0].id);

      const silver = await fetchAchievementsByTier("silver");
      expect(silver.every((a) => a.tier === "silver")).toBe(true);
    });

    it("fetchDemoLearner and marketing claims work seamlessly", async () => {
      const demo = await fetchDemoLearner();
      expect(demo.name).toBeDefined();

      const claims = await fetchMarketingClaims();
      expect(claims.length).toBeGreaterThan(0);

      const claim = await fetchMarketingClaim(claims[0].id);
      expect(claim?.id).toBe(claims[0].id);
    });

    it("fetch navigation helpers work seamlessly", async () => {
      const appNav = await fetchAppNav();
      expect(appNav.length).toBeGreaterThan(0);

      const siteNav = await fetchSiteNav();
      expect(siteNav.length).toBeGreaterThan(0);

      const settingsNav = await fetchSettingsNav();
      expect(settingsNav.length).toBeGreaterThan(0);
    });
  });

  describe("5. Top-level Synchronous Content Helpers (get*) Parity", () => {
    it("synchronous get* functions return expected entities", () => {
      expect(getAlgorithms().length).toBeGreaterThan(0);
      expect(getAlgorithm("two-pointers")?.slug).toBe("two-pointers");
      expect(getAlgorithmsByCategory().arrays).toBeDefined();
      expect(getCategoryMeta().arrays).toBeDefined();
      expect(getAlgorithmsByDifficulty("easy").length).toBeGreaterThan(0);

      expect(getLessons().length).toBeGreaterThan(0);
      expect(getLesson("binary-search")?.slug).toBe("binary-search");
      expect(getLessonByAlgorithm("binary-search")).toBeDefined();
      expect(getLessonsByAlgorithm("binary-search").length).toBeGreaterThan(0);

      expect(getProblems().length).toBeGreaterThan(0);
      expect(getProblem("two-sum")?.slug).toBe("two-sum");
      expect(getProblemsByAlgorithm("two-pointers").length).toBeGreaterThan(0);
      expect(getProblemsByDifficulty("medium").length).toBeGreaterThan(0);

      expect(getPaths().length).toBeGreaterThan(0);
      expect(getPath("interview-prep")?.slug).toBe("interview-prep");

      expect(getQuests().length).toBeGreaterThan(0);
      expect(getQuest("daily-lesson")?.id).toBe("daily-lesson");
      expect(getQuestsByKind("daily").length).toBeGreaterThan(0);

      expect(getAchievements().length).toBeGreaterThan(0);
      expect(getAchievement("first-steps")?.id).toBe("first-steps");
      expect(getAchievementsByTier("bronze").length).toBeGreaterThan(0);

      expect(getDemoLearner().handle).toBe("local_learner");
      const claims = getMarketingClaims();
      expect(claims.length).toBeGreaterThan(0);
      expect(getMarketingClaim(claims[0].id)?.id).toBe(claims[0].id);

      expect(getAppNav().length).toBeGreaterThan(0);
      expect(getSiteNav().length).toBeGreaterThan(0);
      expect(getSettingsNav().length).toBeGreaterThan(0);
    });
  });
});
