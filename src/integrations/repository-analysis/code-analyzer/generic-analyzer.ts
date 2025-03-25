/**
 * Generic Analyzer
 *
 * This module provides a generic code analyzer for languages without specific analyzers.
 */

import * as path from "path"
import { BaseAnalyzer } from "./base-analyzer"
import { AnalysisResult, AnalysisMessage } from "../types"

/**
 * Generic analyzer for languages without specific analyzers
 */
export class GenericAnalyzer extends BaseAnalyzer {
	private language: string

	/**
	 * Create a new generic analyzer
	 * @param language Language name
	 */
	constructor(language: string) {
		super()
		this.language = language
	}

	/**
	 * Analyze code
	 * @param repoPath Path to the repository
	 * @param files Files to analyze
	 * @param options Analysis options
	 * @returns Analysis result
	 */
	async analyze(repoPath: string, files: string[], options?: any): Promise<AnalysisResult> {
		// Filter files for this language
		const languageFiles = files.filter((file) => {
			const ext = path.extname(file).toLowerCase()
			return this.isFileForLanguage(ext)
		})

		if (languageFiles.length === 0) {
			return this.createAnalysisResult(this.language, 10, 10, 10, [])
		}

		// Calculate metrics
		const metrics = await this.calculateMetrics(languageFiles)

		// Generate generic messages
		const messages = this.generateGenericMessages(languageFiles, metrics)

		// Create analysis result
		return this.createAnalysisResult(
			this.language,
			metrics.complexity,
			metrics.documentation,
			metrics.structure,
			messages,
		)
	}

	/**
	 * Check if the analyzer is installed
	 * @returns Always true for generic analyzer
	 */
	async isInstalled(): Promise<boolean> {
		return true // Generic analyzer is always available
	}

	/**
	 * Get installation instructions
	 * @returns Empty string (no installation needed)
	 */
	getInstallInstructions(): string {
		return "" // No installation needed
	}

	/**
	 * Get the name of the analyzer
	 * @returns Analyzer name
	 */
	getName(): string {
		return `Generic Analyzer (${this.language})`
	}

	/**
	 * Check if a file extension belongs to this language
	 * @param extension File extension
	 * @returns Whether the file belongs to this language
	 */
	private isFileForLanguage(extension: string): boolean {
		// Map language to file extensions
		const extensionMap: Record<string, string[]> = {
			c: [".c", ".h"],
			cpp: [".cpp", ".hpp", ".cc", ".hh", ".cxx", ".hxx"],
			csharp: [".cs"],
			go: [".go"],
			ruby: [".rb"],
			php: [".php"],
			swift: [".swift"],
			kotlin: [".kt", ".kts"],
			rust: [".rs"],
			html: [".html", ".htm"],
			css: [".css", ".scss", ".sass", ".less"],
			json: [".json"],
			xml: [".xml"],
			yaml: [".yaml", ".yml"],
			markdown: [".md", ".markdown"],
			sql: [".sql"],
			shell: [".sh", ".bash", ".zsh"],
		}

		// Get extensions for this language
		const extensions = extensionMap[this.language.toLowerCase()]

		// If language is not in the map, return false
		if (!extensions) {
			return false
		}

		// Check if the extension is in the list
		return extensions.includes(extension)
	}

	/**
	 * Calculate metrics for files
	 * @param files Files to analyze
	 * @returns Metrics
	 */
	private async calculateMetrics(
		files: string[],
	): Promise<{ complexity: number; documentation: number; structure: number }> {
		let totalComplexity = 0
		let totalDocumentation = 0
		let totalStructure = 0

		for (const file of files) {
			const content = await this.readFile(file)

			totalComplexity += this.calculateComplexity(content)
			totalDocumentation += this.calculateDocumentation(content)
			totalStructure += this.calculateStructure(content)
		}

		const fileCount = files.length

		return {
			complexity: fileCount > 0 ? totalComplexity / fileCount : 10,
			documentation: fileCount > 0 ? totalDocumentation / fileCount : 10,
			structure: fileCount > 0 ? totalStructure / fileCount : 10,
		}
	}

	/**
	 * Generate generic messages based on metrics
	 * @param files Files analyzed
	 * @param metrics Metrics calculated
	 * @returns Analysis messages
	 */
	private generateGenericMessages(
		files: string[],
		metrics: { complexity: number; documentation: number; structure: number },
	): AnalysisMessage[] {
		const messages: AnalysisMessage[] = []

		// Check file count
		if (files.length > 100) {
			messages.push({
				severity: "medium",
				message: `Large number of ${this.language} files (${files.length}). Consider organizing into subdirectories.`,
			})
		}

		// Check complexity
		if (metrics.complexity < 5) {
			messages.push({
				severity: "high",
				message: `${this.language} code has high complexity. Consider refactoring to reduce nesting and function length.`,
			})
		} else if (metrics.complexity < 7) {
			messages.push({
				severity: "medium",
				message: `${this.language} code has moderate complexity. Look for opportunities to simplify.`,
			})
		}

		// Check documentation
		if (metrics.documentation < 3) {
			messages.push({
				severity: "high",
				message: `${this.language} code is poorly documented. Add comments and documentation.`,
			})
		} else if (metrics.documentation < 6) {
			messages.push({
				severity: "medium",
				message: `${this.language} code has moderate documentation. Consider adding more comments.`,
			})
		}

		// Check structure
		if (metrics.structure < 5) {
			messages.push({
				severity: "high",
				message: `${this.language} code has poor structure. Consider refactoring into smaller files and functions.`,
			})
		} else if (metrics.structure < 7) {
			messages.push({
				severity: "medium",
				message: `${this.language} code has moderate structure. Look for opportunities to improve organization.`,
			})
		}

		// Check for large files
		const largeFiles = files.filter(async (file) => {
			const content = await this.readFile(file)
			return content.split("\n").length > 300
		})

		if (largeFiles.length > 0) {
			messages.push({
				severity: "medium",
				message: `${largeFiles.length} large ${this.language} files found. Consider breaking them into smaller modules.`,
			})
		}

		return messages
	}
}
