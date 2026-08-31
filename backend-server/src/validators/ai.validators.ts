import { z } from "zod";

export const generateInsightSchema = z.object({
  mode: z.enum(["weekly_summary", "project_summary", "bottleneck_explanation", "question"]),
  projectId: z.string().min(1).optional(),
  question: z.string().trim().min(3).max(400).optional(),
});

export type GenerateInsightInput = z.infer<typeof generateInsightSchema>;
