/**
 * Command Handler for Repository Analysis
 *
 * This module registers and handles the "Analyze Repository for Vibe Coding" command.
 */

import * as vscode from "vscode"
import * as path from "path"
import { LanguageDetector } from "./language-detector"
import { createAnalyzer } from "./code-analyzer"
import { RepositoryAnalysisReport, RepositoryAnalysisConfig, DetectedLanguage, AnalysisResult } from "./types"
import { ReportGenerator } from "./report-generator"
import { LlmIntegration } from "./llm-integration"
import { getConfiguration } from "./configuration"

/**
 * Register the repository analysis command
 * @param context VS Code extension context
 */
export function registerRepositoryAnalysisCommand(context: vscode.ExtensionContext): void {
	const disposable = vscode.commands.registerCommand("roo-cline.analyzeRepository", async () => {
		await analyzeRepositoryCommand(context)
	})

	context.subscriptions.push(disposable)
}

/**
 * Handle the repository analysis command
 * @param context VS Code extension context
 */
async function analyzeRepositoryCommand(context: vscode.ExtensionContext): Promise<void> {
	// Show progress notification
	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: "Analyzing Repository for Vibe Coding",
			cancellable: true,
		},
		async (progress, token) => {
			try {
				// Select repository path
				const repoPath = await selectRepositoryPath()
				if (!repoPath) {
					return // User cancelled
				}

				// Get configuration
				const config = await getConfiguration()

				// Report progress
				progress.report({ message: "Detecting languages...", increment: 10 })

				// Detect languages
				const languageDetector = new LanguageDetector()
				const detectedLanguages = await languageDetector.detectLanguages(repoPath, config, token)

				if (token.isCancellationRequested) {
					return
				}

				// Report progress
				progress.report({ message: "Analyzing code...", increment: 20 })

				// Analyze code for each language
				const languageAnalyses: Record<string, AnalysisResult> = {}

				for (const language of detectedLanguages) {
					if (token.isCancellationRequested) {
						return
					}

					const analyzer = createAnalyzer(language.name)
					const analysisResult = await analyzer.analyze(repoPath, language.files, config)
					languageAnalyses[language.name] = analysisResult

					progress.report({
						message: `Analyzed ${language.name} (${Math.round(language.percentage)}%)`,
						increment: 30 / detectedLanguages.length,
					})
				}

				if (token.isCancellationRequested) {
					return
				}

				// Report progress
				progress.report({ message: "Performing LLM analysis...", increment: 20 })

				// Perform LLM analysis
				const llmIntegration = new LlmIntegration()

				const llmSummary = await llmIntegration.generateCodebaseSummary(
					repoPath,
					detectedLanguages,
					config.summaryLlmProfile,
					token,
				)

				if (token.isCancellationRequested) {
					return
				}

				const llmReadability = await llmIntegration.assessReadability(
					repoPath,
					detectedLanguages,
					languageAnalyses,
					config.readabilityLlmProfile,
					token,
				)

				if (token.isCancellationRequested) {
					return
				}

				const recommendations = await llmIntegration.generateRecommendations(
					repoPath,
					detectedLanguages,
					languageAnalyses,
					config.recommendationsLlmProfile,
					token,
				)

				if (token.isCancellationRequested) {
					return
				}

				// Report progress
				progress.report({ message: "Generating report...", increment: 20 })

				// Generate report
				const reportGenerator = new ReportGenerator()
				const report: RepositoryAnalysisReport = {
					overallScore: reportGenerator.calculateOverallScore(languageAnalyses, llmReadability),
					languageAnalyses,
					llmSummary,
					llmReadability,
					recommendations,
					timestamp: new Date().toISOString(),
				}

				// Display report
				await reportGenerator.displayReport(report, context)
			} catch (error) {
				vscode.window.showErrorMessage(
					`Error analyzing repository: ${error instanceof Error ? error.message : String(error)}`,
				)
			}
		},
	)
}

/**
 * Prompt the user to select a repository path
 * @returns The selected repository path or undefined if cancelled
 */
async function selectRepositoryPath(): Promise<string | undefined> {
	// First check if we have an open workspace
	if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
		// If there's only one workspace folder, use it directly
		if (vscode.workspace.workspaceFolders.length === 1) {
			return vscode.workspace.workspaceFolders[0].uri.fsPath
		}

		// If there are multiple workspace folders, let the user choose
		const workspacePicks = vscode.workspace.workspaceFolders.map((folder) => ({
			label: folder.name,
			description: folder.uri.fsPath,
			folder,
		}))

		const selectedWorkspace = await vscode.window.showQuickPick(
			[
				{ label: "Select a different folder...", description: "Browse to select a repository folder" },
				...workspacePicks,
			],
			{ placeHolder: "Select repository to analyze" },
		)

		if (!selectedWorkspace) {
			return undefined // User cancelled
		}

		if (selectedWorkspace.label === "Select a different folder...") {
			// User wants to browse for a folder
			return browseForFolder()
		}

		// Check if the selected workspace has a folder property (type guard)
		if ("folder" in selectedWorkspace) {
			return selectedWorkspace.folder.uri.fsPath
		}

		// If we get here, the user selected a workspace but it doesn't have a folder property
		// This shouldn't happen in practice, but we'll handle it by browsing for a folder
		return browseForFolder()
	}

	// No workspace open, prompt to select a folder
	return browseForFolder()
}

/**
 * Open a file browser to select a folder
 * @returns The selected folder path or undefined if cancelled
 */
async function browseForFolder(): Promise<string | undefined> {
	const options: vscode.OpenDialogOptions = {
		canSelectFiles: false,
		canSelectFolders: true,
		canSelectMany: false,
		openLabel: "Select Repository",
		title: "Select Repository to Analyze",
	}

	const folderUri = await vscode.window.showOpenDialog(options)
	if (folderUri && folderUri.length > 0) {
		return folderUri[0].fsPath
	}

	return undefined
}
