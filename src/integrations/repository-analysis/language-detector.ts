/**
 * Language Detector
 *
 * This module detects programming languages used in a repository.
 */

import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"
import { promisify } from "util"
import { DetectedLanguage, RepositoryAnalysisConfig } from "./types"

const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

/**
 * Maps file extensions to programming languages
 */
const LANGUAGE_EXTENSIONS: Record<string, string> = {
	// JavaScript/TypeScript
	".js": "javascript",
	".jsx": "javascript",
	".ts": "typescript",
	".tsx": "typescript",

	// Python
	".py": "python",
	".pyw": "python",
	".ipynb": "python",

	// Java
	".java": "java",

	// C#
	".cs": "csharp",

	// C/C++
	".c": "c",
	".cpp": "cpp",
	".h": "cpp",
	".hpp": "cpp",

	// Ruby
	".rb": "ruby",

	// PHP
	".php": "php",

	// Go
	".go": "go",

	// Rust
	".rs": "rust",

	// Swift
	".swift": "swift",

	// Kotlin
	".kt": "kotlin",

	// HTML/CSS
	".html": "html",
	".css": "css",
	".scss": "css",
	".sass": "css",
	".less": "css",

	// Shell
	".sh": "shell",
	".bash": "shell",
	".zsh": "shell",

	// Other
	".json": "json",
	".xml": "xml",
	".yaml": "yaml",
	".yml": "yaml",
	".md": "markdown",
	".sql": "sql",
}

/**
 * Class for detecting programming languages in a repository
 */
export class LanguageDetector {
	/**
	 * Detect programming languages used in a repository
	 * @param repoPath Path to the repository
	 * @param config Analysis configuration
	 * @param token Cancellation token
	 * @returns Array of detected languages
	 */
	async detectLanguages(
		repoPath: string,
		config: RepositoryAnalysisConfig,
		token: vscode.CancellationToken,
	): Promise<DetectedLanguage[]> {
		// Get all files in the repository
		const files = await this.getAllFiles(repoPath, config, token)

		if (token.isCancellationRequested) {
			return []
		}

		// Count files by language
		const languageCounts: Record<string, string[]> = {}

		for (const file of files) {
			if (token.isCancellationRequested) {
				return []
			}

			const ext = path.extname(file).toLowerCase()
			const language = LANGUAGE_EXTENSIONS[ext]

			if (language) {
				if (!languageCounts[language]) {
					languageCounts[language] = []
				}
				languageCounts[language].push(file)
			}
		}

		// Calculate percentages
		const totalFiles = files.length
		const detectedLanguages: DetectedLanguage[] = []

		for (const [language, languageFiles] of Object.entries(languageCounts)) {
			const percentage = (languageFiles.length / totalFiles) * 100

			detectedLanguages.push({
				name: language,
				files: languageFiles,
				percentage,
			})
		}

		// Sort by percentage (descending)
		return detectedLanguages.sort((a, b) => b.percentage - a.percentage)
	}

	/**
	 * Get all files in the repository
	 * @param repoPath Path to the repository
	 * @param config Analysis configuration
	 * @param token Cancellation token
	 * @returns Array of file paths
	 */
	private async getAllFiles(
		repoPath: string,
		config: RepositoryAnalysisConfig,
		token: vscode.CancellationToken,
	): Promise<string[]> {
		const files: string[] = []

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

		// Recursive function to traverse directories
		const traverseDirectory = async (dirPath: string): Promise<void> => {
			if (token.isCancellationRequested) {
				return
			}

			try {
				const entries = await readdir(dirPath, { withFileTypes: true })

				for (const entry of entries) {
					if (token.isCancellationRequested) {
						return
					}

					const fullPath = path.join(dirPath, entry.name)
					const relativePath = path.relative(repoPath, fullPath)

					// Skip ignored directories
					if (entry.isDirectory() && ignoreDirs.has(entry.name)) {
						continue
					}

					// Apply include/exclude patterns
					if (config.excludePatterns.some((pattern) => this.matchGlobPattern(relativePath, pattern))) {
						continue
					}

					if (
						config.includePatterns.length > 0 &&
						!config.includePatterns.some((pattern) => this.matchGlobPattern(relativePath, pattern))
					) {
						continue
					}

					if (entry.isDirectory()) {
						await traverseDirectory(fullPath)
					} else if (entry.isFile()) {
						files.push(fullPath)
					}
				}
			} catch (error) {
				console.error(`Error traversing directory ${dirPath}:`, error)
			}
		}

		await traverseDirectory(repoPath)
		return files
	}

	/**
	 * Match a path against a glob pattern
	 * @param path Path to match
	 * @param pattern Glob pattern
	 * @returns Whether the path matches the pattern
	 */
	private matchGlobPattern(path: string, pattern: string): boolean {
		// Simple glob pattern matching
		// Convert glob pattern to regex
		const regex = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".")

		return new RegExp(`^${regex}$`).test(path)
	}
}
