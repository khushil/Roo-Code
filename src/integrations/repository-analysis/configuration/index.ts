/**
 * Configuration for Repository Analysis
 *
 * This module provides functions for getting and setting repository analysis configuration.
 */

import * as vscode from "vscode"
import { RepositoryAnalysisConfig } from "../types"

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RepositoryAnalysisConfig = {
	includePatterns: [],
	excludePatterns: [
		"**/node_modules/**",
		"**/dist/**",
		"**/build/**",
		"**/.git/**",
		"**/vendor/**",
		"**/bin/**",
		"**/obj/**",
		"**/__pycache__/**",
		"**/venv/**",
		"**/.venv/**",
		"**/env/**",
		"**/.env/**",
		"**/.idea/**",
		"**/.vscode/**",
	],
	summaryLlmProfile: undefined,
	readabilityLlmProfile: undefined,
	recommendationsLlmProfile: undefined,
	enabledAnalyzers: ["javascript", "typescript", "python", "java", "generic"],
	maxFilesPerChunk: 100,
	samplingStrategy: "importance",
	samplingPercentage: 100,
}

/**
 * Get repository analysis configuration
 * @returns Repository analysis configuration
 */
export async function getConfiguration(): Promise<RepositoryAnalysisConfig> {
	const config = vscode.workspace.getConfiguration("roo-cline.repositoryAnalysis")

	return {
		includePatterns: config.get<string[]>("includePatterns") || DEFAULT_CONFIG.includePatterns,
		excludePatterns: config.get<string[]>("excludePatterns") || DEFAULT_CONFIG.excludePatterns,
		summaryLlmProfile: config.get<string>("summaryLlmProfile") || DEFAULT_CONFIG.summaryLlmProfile,
		readabilityLlmProfile: config.get<string>("readabilityLlmProfile") || DEFAULT_CONFIG.readabilityLlmProfile,
		recommendationsLlmProfile:
			config.get<string>("recommendationsLlmProfile") || DEFAULT_CONFIG.recommendationsLlmProfile,
		enabledAnalyzers: config.get<string[]>("enabledAnalyzers") || DEFAULT_CONFIG.enabledAnalyzers,
		maxFilesPerChunk: config.get<number>("maxFilesPerChunk") || DEFAULT_CONFIG.maxFilesPerChunk,
		samplingStrategy:
			config.get<"random" | "importance" | "none">("samplingStrategy") || DEFAULT_CONFIG.samplingStrategy,
		samplingPercentage: config.get<number>("samplingPercentage") || DEFAULT_CONFIG.samplingPercentage,
	}
}

/**
 * Update repository analysis configuration
 * @param config Repository analysis configuration
 */
export async function updateConfiguration(config: Partial<RepositoryAnalysisConfig>): Promise<void> {
	const vsConfig = vscode.workspace.getConfiguration("roo-cline.repositoryAnalysis")

	for (const [key, value] of Object.entries(config)) {
		if (value !== undefined) {
			await vsConfig.update(key, value, vscode.ConfigurationTarget.Global)
		}
	}
}

/**
 * Register repository analysis configuration
 */
export function registerConfiguration(): void {
	// Register configuration in package.json
	// This is done in the package.json file
}

/**
 * Get available LLM profiles
 * @returns Available LLM profiles
 */
export async function getAvailableLlmProfiles(): Promise<{ id: string; name: string }[]> {
	// In a real implementation, this would get the profiles from the API configuration
	// For now, return a placeholder
	return [
		{ id: "default", name: "Default (Claude)" },
		{ id: "claude-3-opus", name: "Claude 3 Opus" },
		{ id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
		{ id: "claude-3-haiku", name: "Claude 3 Haiku" },
	]
}

/**
 * Show configuration UI
 * @returns Updated configuration
 */
export async function showConfigurationUI(): Promise<RepositoryAnalysisConfig | undefined> {
	const currentConfig = await getConfiguration()
	const availableProfiles = await getAvailableLlmProfiles()

	// Create quick pick items for LLM profiles
	const profileItems = [
		{ label: "$(close) None", id: undefined },
		...availableProfiles.map((profile) => ({
			label: `$(person) ${profile.name}`,
			id: profile.id,
		})),
	]

	// Show quick pick for summary LLM profile
	const summaryProfile = await vscode.window.showQuickPick(profileItems, {
		placeHolder: "Select LLM profile for codebase summary",
		title: "Codebase Summary LLM Profile",
	})

	if (summaryProfile === undefined) {
		return undefined // User cancelled
	}

	// Show quick pick for readability LLM profile
	const readabilityProfile = await vscode.window.showQuickPick(profileItems, {
		placeHolder: "Select LLM profile for readability assessment",
		title: "Readability Assessment LLM Profile",
	})

	if (readabilityProfile === undefined) {
		return undefined // User cancelled
	}

	// Show quick pick for recommendations LLM profile
	const recommendationsProfile = await vscode.window.showQuickPick(profileItems, {
		placeHolder: "Select LLM profile for recommendations",
		title: "Recommendations LLM Profile",
	})

	if (recommendationsProfile === undefined) {
		return undefined // User cancelled
	}

	// Show quick pick for sampling strategy
	const samplingStrategy = await vscode.window.showQuickPick(
		[
			{ label: "$(star-full) Importance-based sampling", id: "importance" },
			{ label: "$(refresh) Random sampling", id: "random" },
			{ label: "$(check) No sampling (analyze all files)", id: "none" },
		],
		{
			placeHolder: "Select sampling strategy",
			title: "Sampling Strategy",
		},
	)

	if (samplingStrategy === undefined) {
		return undefined // User cancelled
	}

	// Show input box for sampling percentage
	const samplingPercentageStr = await vscode.window.showInputBox({
		prompt: "Enter sampling percentage (1-100)",
		value: currentConfig.samplingPercentage.toString(),
		validateInput: (value) => {
			const num = parseInt(value, 10)
			if (isNaN(num) || num < 1 || num > 100) {
				return "Please enter a number between 1 and 100"
			}
			return null
		},
	})

	if (samplingPercentageStr === undefined) {
		return undefined // User cancelled
	}

	const samplingPercentage = parseInt(samplingPercentageStr, 10)

	// Update configuration
	const newConfig: RepositoryAnalysisConfig = {
		...currentConfig,
		summaryLlmProfile: summaryProfile.id,
		readabilityLlmProfile: readabilityProfile.id,
		recommendationsLlmProfile: recommendationsProfile.id,
		samplingStrategy: samplingStrategy.id as "random" | "importance" | "none",
		samplingPercentage,
	}

	await updateConfiguration(newConfig)

	return newConfig
}
