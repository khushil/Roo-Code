/**
 * Python Analyzer
 *
 * This module provides a code analyzer for Python.
 */

import * as path from "path"
import * as childProcess from "child_process"
import { promisify } from "util"
import { BaseAnalyzer } from "./base-analyzer"
import { AnalysisResult, AnalysisMessage } from "../types"

const exec = promisify(childProcess.exec)

/**
 * Python analyzer
 */
export class PythonAnalyzer extends BaseAnalyzer {
	/**
	 * Analyze Python code
	 * @param repoPath Path to the repository
	 * @param files Files to analyze
	 * @param options Analysis options
	 * @returns Analysis result
	 */
	async analyze(repoPath: string, files: string[], options?: any): Promise<AnalysisResult> {
		// Filter Python files
		const pythonFiles = files.filter((file) => {
			const ext = path.extname(file).toLowerCase()
			return ext === ".py" || ext === ".pyw"
		})

		if (pythonFiles.length === 0) {
			return this.createAnalysisResult("python", 10, 10, 10, [])
		}

		// Analyze with Pylint if available
		const isPylintInstalled = await this.isInstalled()
		let pylintMessages: AnalysisMessage[] = []

		if (isPylintInstalled) {
			pylintMessages = await this.runPylint(repoPath, pythonFiles)
		}

		// Calculate metrics
		const metrics = await this.calculateMetrics(pythonFiles)

		// Create analysis result
		return this.createAnalysisResult(
			"python",
			metrics.complexity,
			metrics.documentation,
			metrics.structure,
			pylintMessages,
		)
	}

	/**
	 * Check if Pylint is installed
	 * @returns Whether Pylint is installed
	 */
	async isInstalled(): Promise<boolean> {
		try {
			await exec("pylint --version")
			return true
		} catch (error) {
			return false
		}
	}

	/**
	 * Get installation instructions for Pylint
	 * @returns Installation instructions
	 */
	getInstallInstructions(): string {
		return "Install Pylint by running: pip install pylint"
	}

	/**
	 * Get the name of the analyzer
	 * @returns Analyzer name
	 */
	getName(): string {
		return "Python Analyzer (Pylint)"
	}

	/**
	 * Run Pylint on Python files
	 * @param repoPath Path to the repository
	 * @param files Files to analyze
	 * @returns Analysis messages
	 */
	private async runPylint(repoPath: string, files: string[]): Promise<AnalysisMessage[]> {
		try {
			// Run Pylint on the files
			const filePaths = files.join(" ")
			const { stdout } = await exec(`pylint ${filePaths} --output-format=json`, {
				cwd: repoPath,
				maxBuffer: 1024 * 1024 * 10, // 10MB buffer
			})

			// Parse Pylint output
			const pylintResults = JSON.parse(stdout)

			// Convert Pylint messages to analysis messages
			const messages: AnalysisMessage[] = []

			for (const result of pylintResults) {
				let severity: "high" | "medium" | "low"

				// Map Pylint message types to our severity levels
				switch (result.type) {
					case "error":
					case "fatal":
						severity = "high"
						break
					case "warning":
						severity = "medium"
						break
					default:
						severity = "low"
				}

				messages.push({
					severity,
					message: result.message,
					file: result.path,
					line: result.line,
				})
			}

			return messages
		} catch (error) {
			console.error("Error running Pylint:", error)
			return []
		}
	}

	/**
	 * Calculate metrics for Python files
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
	 * Calculate documentation score for Python files
	 * @param content Code content
	 * @returns Documentation score (0-10, higher is better)
	 */
	protected override calculateDocumentation(content: string): number {
		// Python-specific documentation metrics:
		// 1. Docstrings (""" or ''')
		// 2. Comment ratio

		const lines = content.split("\n")
		const totalLines = lines.length

		// Count comment lines
		const commentLines = lines.filter((line) => {
			const trimmed = line.trim()
			return trimmed.startsWith("#")
		}).length

		// Calculate comment ratio
		const commentRatio = totalLines > 0 ? commentLines / totalLines : 0

		// Count docstrings
		const docstringRegex = /"""[\s\S]*?"""|'''[\s\S]*?'''/g
		const docstringMatches = content.match(docstringRegex) || []
		const docstringCount = docstringMatches.length

		// Calculate documentation score (0-10)
		let documentationScore = 0

		// Comment ratio: >0.2 is good
		if (commentRatio > 0.2) {
			documentationScore += 4
		} else if (commentRatio > 0.1) {
			documentationScore += 2
		} else if (commentRatio > 0.05) {
			documentationScore += 1
		}

		// Docstrings: >5 is good
		if (docstringCount > 5) {
			documentationScore += 6
		} else if (docstringCount > 3) {
			documentationScore += 4
		} else if (docstringCount > 0) {
			documentationScore += 2
		}

		return Math.min(10, documentationScore)
	}
}
