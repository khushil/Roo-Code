/**
 * LLM Integration for Repository Analysis
 *
 * This module provides functions for integrating with LLMs for repository analysis.
 */

import * as vscode from "vscode"
import * as fs from "fs"
import * as path from "path"
import { promisify } from "util"
import { DetectedLanguage, AnalysisResult, Recommendation } from "../types"

const readFile = promisify(fs.readFile)
const readdir = promisify(fs.readdir)

/**
 * LLM integration for repository analysis
 */
export class LlmIntegration {
	/**
	 * Generate a codebase summary using an LLM
	 * @param repoPath Path to the repository
	 * @param detectedLanguages Detected languages
	 * @param llmProfileId LLM profile ID
	 * @param token Cancellation token
	 * @returns Codebase summary
	 */
	async generateCodebaseSummary(
		repoPath: string,
		detectedLanguages: DetectedLanguage[],
		llmProfileId: string | undefined,
		token: vscode.CancellationToken,
	): Promise<string> {
		// If no LLM profile is selected, return a generic summary
		if (!llmProfileId) {
			return this.generateGenericSummary(detectedLanguages)
		}

		try {
			// Get repository information
			const repoInfo = await this.getRepositoryInfo(repoPath)

			// Get sample files for each language
			const sampleFiles: Record<string, string> = {}

			for (const language of detectedLanguages) {
				if (token.isCancellationRequested) {
					return this.generateGenericSummary(detectedLanguages)
				}

				// Get up to 3 sample files for each language
				const samples = language.files.slice(0, 3)

				for (const sample of samples) {
					try {
						const content = await readFile(sample, "utf-8")
						sampleFiles[sample] = content
					} catch (error) {
						console.error(`Error reading file ${sample}:`, error)
					}
				}
			}

			// Create prompt for LLM
			const prompt = this.createSummaryPrompt(repoInfo, detectedLanguages, sampleFiles)

			// In a real implementation, this would call the LLM API
			// For now, return a placeholder that shows the prompt would be used
			return `This is a placeholder codebase summary. In a real implementation, the LLM with profile ID "${llmProfileId}" would receive a detailed prompt and return a comprehensive analysis of the codebase structure, organization, and key components.`
		} catch (error) {
			console.error("Error generating codebase summary:", error)
			return this.generateGenericSummary(detectedLanguages)
		}
	}

	/**
	 * Assess code readability using an LLM
	 * @param repoPath Path to the repository
	 * @param detectedLanguages Detected languages
	 * @param languageAnalyses Language analysis results
	 * @param llmProfileId LLM profile ID
	 * @param token Cancellation token
	 * @returns Readability assessment
	 */
	async assessReadability(
		repoPath: string,
		detectedLanguages: DetectedLanguage[],
		languageAnalyses: Record<string, AnalysisResult>,
		llmProfileId: string | undefined,
		token: vscode.CancellationToken,
	): Promise<string> {
		// If no LLM profile is selected, return a generic assessment
		if (!llmProfileId) {
			return this.generateGenericReadabilityAssessment(languageAnalyses)
		}

		try {
			// Get sample files for each language
			const sampleFiles: Record<string, string> = {}

			for (const language of detectedLanguages) {
				if (token.isCancellationRequested) {
					return this.generateGenericReadabilityAssessment(languageAnalyses)
				}

				// Get up to 2 sample files for each language
				const samples = language.files.slice(0, 2)

				for (const sample of samples) {
					try {
						const content = await readFile(sample, "utf-8")
						sampleFiles[sample] = content
					} catch (error) {
						console.error(`Error reading file ${sample}:`, error)
					}
				}
			}

			// Create prompt for LLM
			const prompt = this.createReadabilityPrompt(languageAnalyses, sampleFiles)

			// In a real implementation, this would call the LLM API
			// For now, return a placeholder that shows the prompt would be used
			return `This is a placeholder readability assessment. In a real implementation, the LLM with profile ID "${llmProfileId}" would receive a detailed prompt and return a comprehensive assessment of code readability, including language-specific insights and overall readability score.`
		} catch (error) {
			console.error("Error assessing readability:", error)
			return this.generateGenericReadabilityAssessment(languageAnalyses)
		}
	}

	/**
	 * Generate recommendations using an LLM
	 * @param repoPath Path to the repository
	 * @param detectedLanguages Detected languages
	 * @param languageAnalyses Language analysis results
	 * @param llmProfileId LLM profile ID
	 * @param token Cancellation token
	 * @returns Recommendations
	 */
	async generateRecommendations(
		repoPath: string,
		detectedLanguages: DetectedLanguage[],
		languageAnalyses: Record<string, AnalysisResult>,
		llmProfileId: string | undefined,
		token: vscode.CancellationToken,
	): Promise<Recommendation[]> {
		// If no LLM profile is selected, return generic recommendations
		if (!llmProfileId) {
			return this.generateGenericRecommendations(languageAnalyses)
		}

		try {
			// Create prompt for LLM
			const prompt = this.createRecommendationsPrompt(languageAnalyses)

			// In a real implementation, this would call the LLM API and parse the response
			// For now, return placeholder recommendations that show the prompt would be used
			return [
				{
					priority: "high",
					category: "code",
					message: `This is a placeholder recommendation. In a real implementation, the LLM with profile ID "${llmProfileId}" would receive a detailed prompt and return structured recommendations for improving the codebase for "vibe coding".`,
				},
			]
		} catch (error) {
			console.error("Error generating recommendations:", error)
			return this.generateGenericRecommendations(languageAnalyses)
		}
	}

	/**
	 * Get repository information
	 * @param repoPath Path to the repository
	 * @returns Repository information
	 */
	private async getRepositoryInfo(repoPath: string): Promise<{ name: string; readme: string; fileCount: number }> {
		try {
			// Get repository name
			const name = path.basename(repoPath)

			// Get README content
			let readme = ""
			const readmePaths = [
				path.join(repoPath, "README.md"),
				path.join(repoPath, "README.txt"),
				path.join(repoPath, "readme.md"),
				path.join(repoPath, "Readme.md"),
			]

			for (const readmePath of readmePaths) {
				try {
					readme = await readFile(readmePath, "utf-8")
					break
				} catch (error) {
					// Ignore error and try next path
				}
			}

			// Count files
			const fileCount = await this.countFiles(repoPath)

			return { name, readme, fileCount }
		} catch (error) {
			console.error("Error getting repository information:", error)
			return { name: "Unknown", readme: "", fileCount: 0 }
		}
	}

	/**
	 * Count files in a directory recursively
	 * @param dirPath Directory path
	 * @returns File count
	 */
	private async countFiles(dirPath: string): Promise<number> {
		try {
			const entries = await readdir(dirPath, { withFileTypes: true })

			// Define directories to ignore
			const ignoreDirs = new Set([
				"node_modules",
				".git",
				"dist",
				"build",
				"bin",
				"obj",
				"__pycache__",
				"venv",
				".venv",
				"env",
				".env",
				".idea",
				".vscode",
			])

			let count = 0

			for (const entry of entries) {
				const fullPath = path.join(dirPath, entry.name)

				if (entry.isDirectory()) {
					// Skip ignored directories
					if (ignoreDirs.has(entry.name)) {
						continue
					}

					count += await this.countFiles(fullPath)
				} else if (entry.isFile()) {
					count++
				}
			}

			return count
		} catch (error) {
			console.error(`Error counting files in ${dirPath}:`, error)
			return 0
		}
	}

	/**
	 * Create prompt for codebase summary
	 * @param repoInfo Repository information
	 * @param detectedLanguages Detected languages
	 * @param sampleFiles Sample files
	 * @returns Prompt for LLM
	 */
	private createSummaryPrompt(
		repoInfo: { name: string; readme: string; fileCount: number },
		detectedLanguages: DetectedLanguage[],
		sampleFiles: Record<string, string>,
	): string {
		let prompt = `I need you to analyze a codebase and provide a summary of its structure, organization, and key components. This will help me understand how well it's suited for "vibe coding" with Roo Code and Claude.

Repository Name: ${repoInfo.name}
File Count: ${repoInfo.fileCount}

Languages Detected:
${detectedLanguages.map((lang) => `- ${lang.name}: ${lang.files.length} files (${Math.round(lang.percentage)}%)`).join("\n")}

README:
${repoInfo.readme ? (repoInfo.readme.length > 500 ? repoInfo.readme.slice(0, 500) + "..." : repoInfo.readme) : "No README found."}

Sample Files:
`

		// Add sample files (limited to keep prompt size reasonable)
		let sampleCount = 0
		for (const [filePath, content] of Object.entries(sampleFiles)) {
			if (sampleCount >= 5) break

			const fileName = path.basename(filePath)
			const language = path.extname(filePath).slice(1)

			// Limit content size
			const truncatedContent = content.length > 500 ? content.slice(0, 500) + "..." : content
			prompt += `\n--- ${fileName} (${language}) ---\n${truncatedContent}\n`

			sampleCount++
		}

		prompt += `\nPlease provide:
1. A summary of the codebase structure and organization
2. Identification of key components and their relationships
3. Assessment of code clarity and readability
4. Potential challenges for collaborative development with Roo Code and Claude
5. Overall assessment of the codebase's suitability for "vibe coding"

"Vibe coding" refers to a collaborative coding approach where a human developer and an AI assistant (like Claude) work together efficiently. Good "vibe coding" codebases have:
- Clear structure and organization
- Good documentation and comments
- Consistent naming conventions
- Modular design with clear component boundaries
- Reasonable file sizes and function lengths
- Explicit rather than implicit patterns`

		return prompt
	}

	/**
	 * Create prompt for readability assessment
	 * @param languageAnalyses Language analysis results
	 * @param sampleFiles Sample files
	 * @returns Prompt for LLM
	 */
	private createReadabilityPrompt(
		languageAnalyses: Record<string, AnalysisResult>,
		sampleFiles: Record<string, string>,
	): string {
		let prompt = `I need you to assess the readability of a codebase for "vibe coding" with Roo Code and Claude. Here are the analysis results:

Language Analysis Results:
`

		// Add language analysis results
		for (const [language, analysis] of Object.entries(languageAnalyses)) {
			prompt += `\n${language}:
- Overall Score: ${analysis.score.toFixed(1)}/10
- Complexity: ${analysis.metrics.complexity.toFixed(1)}/10
- Documentation: ${analysis.metrics.documentation.toFixed(1)}/10
- Structure: ${analysis.metrics.structure.toFixed(1)}/10
- Issues: ${analysis.messages.length} issues found
`
		}

		prompt += `\nSample Files:
`

		// Add sample files (limited to keep prompt size reasonable)
		let sampleCount = 0
		for (const [filePath, content] of Object.entries(sampleFiles)) {
			if (sampleCount >= 3) break

			const fileName = path.basename(filePath)
			const language = path.extname(filePath).slice(1)

			// Limit content size
			const truncatedContent = content.length > 500 ? content.slice(0, 500) + "..." : content
			prompt += `\n--- ${fileName} (${language}) ---\n${truncatedContent}\n`

			sampleCount++
		}

		prompt += `\nPlease provide:
1. An assessment of the overall readability of the codebase
2. Language-specific readability insights
3. Identification of readability strengths and weaknesses
4. Suggestions for improving readability for "vibe coding"
5. A readability score from 0-10 for the codebase as a whole

Focus on aspects like:
- Naming conventions and clarity
- Comment quality and coverage
- Code organization and structure
- Consistency across files
- Complexity management
- Documentation quality`

		return prompt
	}

	/**
	 * Create prompt for recommendations
	 * @param languageAnalyses Language analysis results
	 * @returns Prompt for LLM
	 */
	private createRecommendationsPrompt(languageAnalyses: Record<string, AnalysisResult>): string {
		let prompt = `I need you to generate recommendations for improving a codebase for "vibe coding" with Roo Code and Claude. Here are the analysis results:

Language Analysis Results:
`

		// Add language analysis results
		for (const [language, analysis] of Object.entries(languageAnalyses)) {
			prompt += `\n${language}:
- Overall Score: ${analysis.score.toFixed(1)}/10
- Complexity: ${analysis.metrics.complexity.toFixed(1)}/10
- Documentation: ${analysis.metrics.documentation.toFixed(1)}/10
- Structure: ${analysis.metrics.structure.toFixed(1)}/10
- Issues: ${analysis.messages.length} issues found
`

			// Add top 5 issues
			if (analysis.messages.length > 0) {
				prompt += `\nTop issues:\n`
				const topIssues = analysis.messages.slice(0, 5)
				for (const issue of topIssues) {
					prompt += `- [${issue.severity}] ${issue.message}\n`
				}
			}
		}

		prompt += `\nPlease provide recommendations in the following format:
[
  {
    "priority": "high|medium|low",
    "category": "code|documentation|structure|general",
    "language": "language_name", // Optional, only if language-specific
    "message": "Detailed recommendation message"
  }
]

Focus on recommendations that would improve:
1. Code clarity and readability
2. Documentation quality
3. Project structure and organization
4. Consistency across the codebase
5. Suitability for collaborative development with AI assistants

"Vibe coding" refers to a collaborative coding approach where a human developer and an AI assistant (like Claude) work together efficiently. Good "vibe coding" codebases have:
- Clear structure and organization
- Good documentation and comments
- Consistent naming conventions
- Modular design with clear component boundaries
- Reasonable file sizes and function lengths
- Explicit rather than implicit patterns`

		return prompt
	}

	/**
	 * Generate a generic codebase summary
	 * @param detectedLanguages Detected languages
	 * @returns Generic codebase summary
	 */
	private generateGenericSummary(detectedLanguages: DetectedLanguage[]): string {
		const languagesList = detectedLanguages
			.map((lang) => `${lang.name} (${Math.round(lang.percentage)}%)`)
			.join(", ")

		return `This codebase contains ${detectedLanguages.length} languages: ${languagesList}. 
    
A more detailed analysis would be provided by an LLM. Please configure an LLM profile to get a more comprehensive summary.`
	}

	/**
	 * Generate a generic readability assessment
	 * @param languageAnalyses Language analysis results
	 * @returns Generic readability assessment
	 */
	private generateGenericReadabilityAssessment(languageAnalyses: Record<string, AnalysisResult>): string {
		const averageScore =
			Object.values(languageAnalyses).reduce((sum, analysis) => sum + analysis.score, 0) /
			Object.values(languageAnalyses).length

		return `The codebase has an average readability score of ${averageScore.toFixed(1)} out of 10.
    
A more detailed assessment would be provided by an LLM. Please configure an LLM profile to get a more comprehensive readability assessment.`
	}

	/**
	 * Generate generic recommendations
	 * @param languageAnalyses Language analysis results
	 * @returns Generic recommendations
	 */
	private generateGenericRecommendations(languageAnalyses: Record<string, AnalysisResult>): Recommendation[] {
		const recommendations: Recommendation[] = []

		// Add recommendations based on analysis results
		for (const [language, analysis] of Object.entries(languageAnalyses)) {
			if (analysis.metrics.complexity < 5) {
				recommendations.push({
					priority: "high",
					category: "code",
					language,
					message: `Reduce code complexity in ${language} files.`,
				})
			}

			if (analysis.metrics.documentation < 5) {
				recommendations.push({
					priority: "medium",
					category: "documentation",
					language,
					message: `Improve documentation in ${language} files.`,
				})
			}

			if (analysis.metrics.structure < 5) {
				recommendations.push({
					priority: "medium",
					category: "structure",
					language,
					message: `Improve code structure in ${language} files.`,
				})
			}
		}

		// Add generic recommendations
		recommendations.push({
			priority: "low",
			category: "general",
			message: "Consider adding a comprehensive README.md file to help Claude understand the project.",
		})

		recommendations.push({
			priority: "low",
			category: "general",
			message: "Use consistent naming conventions across all files to improve readability.",
		})

		return recommendations
	}
}
