/**
 * Base Analyzer
 *
 * This module provides a base class for code analyzers.
 */

import * as fs from "fs"
import * as path from "path"
import { promisify } from "util"
import { CodeAnalyzer } from "./index"
import { AnalysisResult, AnalysisMessage } from "../types"

const readFile = promisify(fs.readFile)

/**
 * Base class for code analyzers
 */
export abstract class BaseAnalyzer implements CodeAnalyzer {
	/**
	 * Analyze code files
	 * @param repoPath Path to the repository
	 * @param files Files to analyze
	 * @param options Analysis options
	 * @returns Analysis result
	 */
	abstract analyze(repoPath: string, files: string[], options?: any): Promise<AnalysisResult>

	/**
	 * Check if the analyzer is installed
	 * @returns Whether the analyzer is installed
	 */
	abstract isInstalled(): Promise<boolean>

	/**
	 * Get installation instructions
	 * @returns Installation instructions
	 */
	abstract getInstallInstructions(): string

	/**
	 * Get the name of the analyzer
	 * @returns Analyzer name
	 */
	abstract getName(): string

	/**
	 * Calculate code complexity score
	 * @param content Code content
	 * @returns Complexity score (0-10, lower is better)
	 */
	protected calculateComplexity(content: string): number {
		// Basic complexity metrics:
		// 1. Line length
		// 2. Function length
		// 3. Nesting depth

		const lines = content.split("\n")
		const avgLineLength = this.calculateAverageLineLength(lines)
		const maxNestingDepth = this.calculateMaxNestingDepth(content)
		const avgFunctionLength = this.calculateAverageFunctionLength(content)

		// Calculate complexity score (0-10, lower is better)
		let complexityScore = 0

		// Line length: >100 chars is bad
		if (avgLineLength > 100) {
			complexityScore += 3
		} else if (avgLineLength > 80) {
			complexityScore += 2
		} else if (avgLineLength > 60) {
			complexityScore += 1
		}

		// Nesting depth: >5 levels is bad
		if (maxNestingDepth > 5) {
			complexityScore += 4
		} else if (maxNestingDepth > 3) {
			complexityScore += 2
		} else if (maxNestingDepth > 2) {
			complexityScore += 1
		}

		// Function length: >50 lines is bad
		if (avgFunctionLength > 50) {
			complexityScore += 3
		} else if (avgFunctionLength > 30) {
			complexityScore += 2
		} else if (avgFunctionLength > 20) {
			complexityScore += 1
		}

		// Invert score so 0 is worst, 10 is best
		return Math.max(0, 10 - complexityScore)
	}

	/**
	 * Calculate documentation score
	 * @param content Code content
	 * @returns Documentation score (0-10, higher is better)
	 */
	protected calculateDocumentation(content: string): number {
		// Basic documentation metrics:
		// 1. Comment ratio
		// 2. Documentation comments (e.g., JSDoc, docstrings)

		const lines = content.split("\n")
		const totalLines = lines.length

		// Count comment lines
		const commentLines = lines.filter((line) => {
			const trimmed = line.trim()
			return (
				trimmed.startsWith("//") ||
				trimmed.startsWith("#") ||
				trimmed.startsWith("/*") ||
				trimmed.startsWith("*") ||
				trimmed.startsWith('"""') ||
				trimmed.startsWith("'''")
			)
		}).length

		// Calculate comment ratio
		const commentRatio = totalLines > 0 ? commentLines / totalLines : 0

		// Count documentation comments
		const docCommentRegex = /\/\*\*|\*\/|"""|'''|\/\*\*\s*@/g
		const docCommentMatches = content.match(docCommentRegex) || []
		const docCommentCount = docCommentMatches.length

		// Calculate documentation score (0-10)
		let documentationScore = 0

		// Comment ratio: >0.2 is good
		if (commentRatio > 0.2) {
			documentationScore += 5
		} else if (commentRatio > 0.1) {
			documentationScore += 3
		} else if (commentRatio > 0.05) {
			documentationScore += 1
		}

		// Documentation comments: >10 is good
		if (docCommentCount > 10) {
			documentationScore += 5
		} else if (docCommentCount > 5) {
			documentationScore += 3
		} else if (docCommentCount > 0) {
			documentationScore += 1
		}

		return Math.min(10, documentationScore)
	}

	/**
	 * Calculate structure score
	 * @param content Code content
	 * @returns Structure score (0-10, higher is better)
	 */
	protected calculateStructure(content: string): number {
		// Basic structure metrics:
		// 1. Function/class length
		// 2. File length
		// 3. Consistent indentation

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

		// Check for consistent indentation
		const indentationConsistency = this.checkIndentationConsistency(lines)
		if (!indentationConsistency) {
			structureScore -= 2
		}

		return Math.max(0, structureScore)
	}

	/**
	 * Calculate average line length
	 * @param lines Code lines
	 * @returns Average line length
	 */
	private calculateAverageLineLength(lines: string[]): number {
		const totalLength = lines.reduce((sum, line) => sum + line.length, 0)
		return lines.length > 0 ? totalLength / lines.length : 0
	}

	/**
	 * Calculate maximum nesting depth
	 * @param content Code content
	 * @returns Maximum nesting depth
	 */
	private calculateMaxNestingDepth(content: string): number {
		// Simple heuristic: count braces/indentation
		const lines = content.split("\n")
		let maxDepth = 0
		let currentDepth = 0

		for (const line of lines) {
			const openBraces = (line.match(/\{/g) || []).length
			const closeBraces = (line.match(/\}/g) || []).length

			currentDepth += openBraces - closeBraces
			maxDepth = Math.max(maxDepth, currentDepth)
		}

		return maxDepth
	}

	/**
	 * Calculate average function length
	 * @param content Code content
	 * @returns Average function length
	 */
	private calculateAverageFunctionLength(content: string): number {
		// Simple heuristic: look for function declarations
		const functionRegex = /function\s+\w+\s*\(|def\s+\w+\s*\(|\w+\s*=\s*function\s*\(|\w+\s*\([^)]*\)\s*{/g
		const functionMatches = content.match(functionRegex) || []

		if (functionMatches.length === 0) {
			return 0
		}

		// Estimate average function length as total lines / number of functions
		const lines = content.split("\n")
		return lines.length / functionMatches.length
	}

	/**
	 * Check for consistent indentation
	 * @param lines Code lines
	 * @returns Whether indentation is consistent
	 */
	private checkIndentationConsistency(lines: string[]): boolean {
		// Check if indentation is consistent (spaces vs. tabs)
		const spacesIndent = lines.filter((line) => line.startsWith("  ")).length
		const tabsIndent = lines.filter((line) => line.startsWith("\t")).length

		// If both spaces and tabs are used, indentation is inconsistent
		return !(spacesIndent > 0 && tabsIndent > 0)
	}

	/**
	 * Read file content
	 * @param filePath Path to the file
	 * @returns File content
	 */
	protected async readFile(filePath: string): Promise<string> {
		try {
			const content = await readFile(filePath, "utf-8")
			return content
		} catch (error) {
			console.error(`Error reading file ${filePath}:`, error)
			return ""
		}
	}

	/**
	 * Create a generic analysis result
	 * @param language Language name
	 * @param complexity Complexity score
	 * @param documentation Documentation score
	 * @param structure Structure score
	 * @param messages Analysis messages
	 * @returns Analysis result
	 */
	protected createAnalysisResult(
		language: string,
		complexity: number,
		documentation: number,
		structure: number,
		messages: AnalysisMessage[],
	): AnalysisResult {
		// Calculate overall score (weighted average)
		const score = complexity * 0.4 + documentation * 0.3 + structure * 0.3

		return {
			language,
			score,
			messages,
			metrics: {
				complexity,
				documentation,
				structure,
			},
		}
	}
}
