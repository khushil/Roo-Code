/**
 * Types for Repository Analysis Feature
 */

import * as vscode from "vscode"

/**
 * Represents a detected language in the repository
 */
export interface DetectedLanguage {
	name: string // Language name (e.g., 'javascript', 'python')
	files: string[] // List of files using this language
	percentage: number // Percentage of repository using this language
}

/**
 * Analysis result for a specific language
 */
export interface AnalysisResult {
	language: string // Language name
	score: number // Analysis score (0-10)
	messages: AnalysisMessage[]
	metrics: {
		complexity: number // Code complexity score
		documentation: number // Documentation coverage score
		structure: number // Code structure score
	}
}

/**
 * Message from code analysis
 */
export interface AnalysisMessage {
	severity: "high" | "medium" | "low"
	message: string
	file?: string // Optional file reference
	line?: number // Optional line reference
}

/**
 * LLM profile for analysis tasks
 */
export interface LlmProfile {
	id: string // Profile ID
	name: string // Display name
	provider: string // API provider (e.g., 'anthropic', 'openai')
	modelId: string // Model ID
	apiKey?: string // API key (if different from global)
}

/**
 * LLM analysis task
 */
export interface LlmAnalysisTask {
	type: "summary" | "readability" | "recommendations"
	profile: LlmProfile
	input: any // Task-specific input data
}

/**
 * LLM analysis result
 */
export interface LlmAnalysisResult {
	type: "summary" | "readability" | "recommendations"
	content: string // LLM response content
	score?: number // Optional score (0-10)
}

/**
 * Repository analysis report
 */
export interface RepositoryAnalysisReport {
	overallScore: number // Overall 'Vibe Coding' score (0-10)
	languageAnalyses: Record<string, AnalysisResult>
	llmSummary: string // LLM-generated summary
	llmReadability: string // LLM readability assessment
	recommendations: Recommendation[]
	timestamp: string // Analysis timestamp
}

/**
 * Recommendation for improving repository
 */
export interface Recommendation {
	priority: "high" | "medium" | "low"
	category: "code" | "documentation" | "structure" | "general"
	language?: string // Optional language-specific recommendation
	message: string // Recommendation text
	file?: string // Optional file reference
	line?: number // Optional line reference
}

/**
 * Configuration for repository analysis
 */
export interface RepositoryAnalysisConfig {
	includePatterns: string[] // Glob patterns to include
	excludePatterns: string[] // Glob patterns to exclude
	summaryLlmProfile?: string // Profile ID for summary task
	readabilityLlmProfile?: string // Profile ID for readability task
	recommendationsLlmProfile?: string // Profile ID for recommendations task
	enabledAnalyzers: string[] // Enabled code analyzers
	maxFilesPerChunk: number // Maximum files to analyze in one chunk
	samplingStrategy: "random" | "importance" | "none" // How to sample files
	samplingPercentage: number // Percentage of files to sample (0-100)
}

/**
 * Chunking options for large repositories
 */
export interface ChunkingOptions {
	maxFilesPerChunk: number
	maxChunkSizeBytes: number
	samplingStrategy: "random" | "importance" | "none"
	samplingPercentage: number // 0-100
	includePatterns: string[]
	excludePatterns: string[]
}

/**
 * File chunk for analysis
 */
export interface FileChunk {
	files: string[]
	totalSizeBytes: number
}

/**
 * Generic metrics for code analysis
 */
export interface GenericMetrics {
	complexity: number
	documentation: number
	structure: number
}

/**
 * Results from applying heuristics
 */
export interface HeuristicResults {
	messages: AnalysisMessage[]
	score: number
}
