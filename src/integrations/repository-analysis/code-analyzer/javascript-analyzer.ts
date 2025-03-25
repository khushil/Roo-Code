/**
 * JavaScript/TypeScript Analyzer
 *
 * This module provides a code analyzer for JavaScript and TypeScript.
 */

import * as path from "path"
import * as childProcess from "child_process"
import { promisify } from "util"
import { BaseAnalyzer } from "./base-analyzer"
import { AnalysisResult, AnalysisMessage } from "../types"

const exec = promisify(childProcess.exec)

/**
 * JavaScript/TypeScript analyzer
 */
export class JavaScriptAnalyzer extends BaseAnalyzer {
	/**
	 * Analyze JavaScript/TypeScript code
	 * @param repoPath Path to the repository
	 * @param files Files to analyze
	 * @param options Analysis options
	 * @returns Analysis result
	 */
	async analyze(repoPath: string, files: string[], options?: any): Promise<AnalysisResult> {
		// Filter JavaScript/TypeScript files
		const jsFiles = files.filter((file) => {
			const ext = path.extname(file).toLowerCase()
			return ext === ".js" || ext === ".jsx" || ext === ".ts" || ext === ".tsx"
		})

		if (jsFiles.length === 0) {
			return this.createAnalysisResult("javascript", 10, 10, 10, [])
		}

		// Analyze with ESLint if available
		const isEslintInstalled = await this.isInstalled()
		let eslintMessages: AnalysisMessage[] = []

		if (isEslintInstalled) {
			eslintMessages = await this.runEslint(repoPath, jsFiles)
		}

		// Calculate metrics
		const metrics = await this.calculateMetrics(jsFiles)

		// Create analysis result
		return this.createAnalysisResult(
			"javascript",
			metrics.complexity,
			metrics.documentation,
			metrics.structure,
			eslintMessages,
		)
	}

	/**
	 * Check if ESLint is installed
	 * @returns Whether ESLint is installed
	 */
	async isInstalled(): Promise<boolean> {
		try {
			await exec("npx eslint --version")
			return true
		} catch (error) {
			return false
		}
	}

	/**
	 * Get installation instructions for ESLint
	 * @returns Installation instructions
	 */
	getInstallInstructions(): string {
		return "Install ESLint by running: npm install eslint --save-dev"
	}

	/**
	 * Get the name of the analyzer
	 * @returns Analyzer name
	 */
	getName(): string {
		return "JavaScript/TypeScript Analyzer (ESLint)"
	}

	/**
	 * Run ESLint on JavaScript/TypeScript files
	 * @param repoPath Path to the repository
	 * @param files Files to analyze
	 * @returns Analysis messages
	 */
	private async runEslint(repoPath: string, files: string[]): Promise<AnalysisMessage[]> {
		try {
			// Run ESLint on the files
			const filePaths = files.join(" ")
			const { stdout } = await exec(`npx eslint ${filePaths} --format json`, {
				cwd: repoPath,
				maxBuffer: 1024 * 1024 * 10, // 10MB buffer
			})

			// Parse ESLint output
			const eslintResults = JSON.parse(stdout)

			// Convert ESLint messages to analysis messages
			const messages: AnalysisMessage[] = []

			for (const result of eslintResults) {
				for (const message of result.messages) {
					let severity: "high" | "medium" | "low"

					// Map ESLint severity to our severity levels
					switch (message.severity) {
						case 2: // Error
							severity = "high"
							break
						case 1: // Warning
							severity = "medium"
							break
						default:
							severity = "low"
					}

					messages.push({
						severity,
						message: message.message,
						file: result.filePath,
						line: message.line,
					})
				}
			}

			return messages
		} catch (error) {
			console.error("Error running ESLint:", error)
			return []
		}
	}

	/**
	 * Calculate metrics for JavaScript/TypeScript files
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
}
