/**
 * Java Analyzer
 *
 * This module provides a code analyzer for Java.
 */

import * as path from "path"
import * as childProcess from "child_process"
import { promisify } from "util"
import { BaseAnalyzer } from "./base-analyzer"
import { AnalysisResult, AnalysisMessage } from "../types"

const exec = promisify(childProcess.exec)

/**
 * Java analyzer
 */
export class JavaAnalyzer extends BaseAnalyzer {
	/**
	 * Analyze Java code
	 * @param repoPath Path to the repository
	 * @param files Files to analyze
	 * @param options Analysis options
	 * @returns Analysis result
	 */
	async analyze(repoPath: string, files: string[], options?: any): Promise<AnalysisResult> {
		// Filter Java files
		const javaFiles = files.filter((file) => {
			const ext = path.extname(file).toLowerCase()
			return ext === ".java"
		})

		if (javaFiles.length === 0) {
			return this.createAnalysisResult("java", 10, 10, 10, [])
		}

		// Analyze with Checkstyle if available
		const isCheckstyleInstalled = await this.isInstalled()
		let checkstyleMessages: AnalysisMessage[] = []

		if (isCheckstyleInstalled) {
			checkstyleMessages = await this.runCheckstyle(repoPath, javaFiles)
		}

		// Calculate metrics
		const metrics = await this.calculateMetrics(javaFiles)

		// Create analysis result
		return this.createAnalysisResult(
			"java",
			metrics.complexity,
			metrics.documentation,
			metrics.structure,
			checkstyleMessages,
		)
	}

	/**
	 * Check if Checkstyle is installed
	 * @returns Whether Checkstyle is installed
	 */
	async isInstalled(): Promise<boolean> {
		try {
			await exec("java -jar checkstyle.jar -version")
			return true
		} catch (error) {
			return false
		}
	}

	/**
	 * Get installation instructions for Checkstyle
	 * @returns Installation instructions
	 */
	getInstallInstructions(): string {
		return "Install Checkstyle by downloading from https://checkstyle.org/ and placing checkstyle.jar in your project directory"
	}

	/**
	 * Get the name of the analyzer
	 * @returns Analyzer name
	 */
	getName(): string {
		return "Java Analyzer (Checkstyle)"
	}

	/**
	 * Run Checkstyle on Java files
	 * @param repoPath Path to the repository
	 * @param files Files to analyze
	 * @returns Analysis messages
	 */
	private async runCheckstyle(repoPath: string, files: string[]): Promise<AnalysisMessage[]> {
		try {
			// Check if checkstyle.xml exists, otherwise use default
			let configPath = path.join(repoPath, "checkstyle.xml")
			const configArg = `-c ${configPath}`

			// Run Checkstyle on the files
			const filePaths = files.join(" ")
			const { stdout } = await exec(`java -jar checkstyle.jar ${configArg} -f xml ${filePaths}`, {
				cwd: repoPath,
				maxBuffer: 1024 * 1024 * 10, // 10MB buffer
			})

			// Parse Checkstyle output (XML format)
			const messages: AnalysisMessage[] = []

			// Simple XML parsing (for a more robust solution, use an XML parser)
			const errorRegex = /<error line="(\d+)" column="\d+" severity="(\w+)" message="([^"]+)"/g
			let match

			while ((match = errorRegex.exec(stdout)) !== null) {
				const [, line, severityStr, message] = match

				let severity: "high" | "medium" | "low"

				// Map Checkstyle severity to our severity levels
				switch (severityStr.toLowerCase()) {
					case "error":
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
					message,
					line: parseInt(line, 10),
				})
			}

			return messages
		} catch (error) {
			console.error("Error running Checkstyle:", error)
			return []
		}
	}

	/**
	 * Calculate metrics for Java files
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
	 * Calculate documentation score for Java files
	 * @param content Code content
	 * @returns Documentation score (0-10, higher is better)
	 */
	protected override calculateDocumentation(content: string): number {
		// Java-specific documentation metrics:
		// 1. Javadoc comments (/** */)
		// 2. Comment ratio

		const lines = content.split("\n")
		const totalLines = lines.length

		// Count comment lines
		const commentLines = lines.filter((line) => {
			const trimmed = line.trim()
			return (
				trimmed.startsWith("//") ||
				trimmed.startsWith("*") ||
				trimmed.startsWith("/*") ||
				trimmed.startsWith("*/")
			)
		}).length

		// Calculate comment ratio
		const commentRatio = totalLines > 0 ? commentLines / totalLines : 0

		// Count Javadoc comments
		const javadocRegex = /\/\*\*[\s\S]*?\*\//g
		const javadocMatches = content.match(javadocRegex) || []
		const javadocCount = javadocMatches.length

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

		// Javadoc comments: >5 is good
		if (javadocCount > 5) {
			documentationScore += 6
		} else if (javadocCount > 3) {
			documentationScore += 4
		} else if (javadocCount > 0) {
			documentationScore += 2
		}

		return Math.min(10, documentationScore)
	}

	/**
	 * Calculate structure score for Java files
	 * @param content Code content
	 * @returns Structure score (0-10, higher is better)
	 */
	protected override calculateStructure(content: string): number {
		// Java-specific structure metrics:
		// 1. Class length
		// 2. Method length
		// 3. Package structure

		const lines = content.split("\n")
		const totalLines = lines.length

		// Calculate structure score (0-10)
		let structureScore = 10

		// File length: >500 lines is bad
		if (totalLines > 500) {
			structureScore -= 3
		} else if (totalLines > 300) {
			structureScore -= 2
		} else if (totalLines > 200) {
			structureScore -= 1
		}

		// Check for too many methods in a class
		const methodCount = this.countMethods(content)
		if (methodCount > 20) {
			structureScore -= 3
		} else if (methodCount > 15) {
			structureScore -= 2
		} else if (methodCount > 10) {
			structureScore -= 1
		}

		return Math.max(0, structureScore)
	}

	/**
	 * Count methods in Java code
	 * @param content Code content
	 * @returns Method count
	 */
	private countMethods(content: string): number {
		// Simple heuristic: look for method declarations
		const methodRegex = /\s(public|private|protected)\s+\w+\s+\w+\s*\([^)]*\)\s*(\{|throws)/g
		const methodMatches = content.match(methodRegex) || []
		return methodMatches.length
	}
}
