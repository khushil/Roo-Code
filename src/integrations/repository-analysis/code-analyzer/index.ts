/**
 * Code Analyzer
 *
 * This module provides a factory function for creating language-specific code analyzers.
 */

import { AnalysisResult } from "../types"
import { BaseAnalyzer } from "./base-analyzer"
import { JavaScriptAnalyzer } from "./javascript-analyzer"
import { PythonAnalyzer } from "./python-analyzer"
import { JavaAnalyzer } from "./java-analyzer"
import { GenericAnalyzer } from "./generic-analyzer"

/**
 * Interface for code analyzers
 */
export interface CodeAnalyzer {
	/**
	 * Analyze code files
	 * @param repoPath Path to the repository
	 * @param files Files to analyze
	 * @param options Analysis options
	 * @returns Analysis result
	 */
	analyze(repoPath: string, files: string[], options?: any): Promise<AnalysisResult>

	/**
	 * Check if the analyzer is installed
	 * @returns Whether the analyzer is installed
	 */
	isInstalled(): Promise<boolean>

	/**
	 * Get installation instructions
	 * @returns Installation instructions
	 */
	getInstallInstructions(): string

	/**
	 * Get the name of the analyzer
	 * @returns Analyzer name
	 */
	getName(): string
}

/**
 * Create a code analyzer for the specified language
 * @param language Language to analyze
 * @returns Code analyzer
 */
export function createAnalyzer(language: string): CodeAnalyzer {
	switch (language.toLowerCase()) {
		case "javascript":
		case "typescript":
			return new JavaScriptAnalyzer()
		case "python":
			return new PythonAnalyzer()
		case "java":
			return new JavaAnalyzer()
		default:
			return new GenericAnalyzer(language)
	}
}

export * from "./base-analyzer"
export * from "./javascript-analyzer"
export * from "./python-analyzer"
export * from "./java-analyzer"
export * from "./generic-analyzer"
