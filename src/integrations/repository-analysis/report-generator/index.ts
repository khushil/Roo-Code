/**
 * Report Generator for Repository Analysis
 *
 * This module provides functions for generating and displaying repository analysis reports.
 */

import * as vscode from "vscode"
import * as path from "path"
import { RepositoryAnalysisReport, AnalysisResult, Recommendation } from "../types"

/**
 * Report generator for repository analysis
 */
export class ReportGenerator {
	/**
	 * Calculate overall "Vibe Coding" score
	 * @param languageAnalyses Language analysis results
	 * @param llmReadability LLM readability assessment
	 * @returns Overall score (0-10)
	 */
	calculateOverallScore(languageAnalyses: Record<string, AnalysisResult>, llmReadability: string): number {
		// Calculate average score from language analyses
		const languageScores = Object.values(languageAnalyses).map((analysis) => analysis.score)
		const averageLanguageScore = languageScores.reduce((sum, score) => sum + score, 0) / languageScores.length

		// Estimate LLM readability score based on text sentiment
		const llmReadabilityScore = this.estimateReadabilityScore(llmReadability)

		// Calculate overall score (weighted average)
		const overallScore = averageLanguageScore * 0.7 + llmReadabilityScore * 0.3

		// Round to 1 decimal place
		return Math.round(overallScore * 10) / 10
	}

	/**
	 * Display repository analysis report
	 * @param report Repository analysis report
	 * @param context VS Code extension context
	 */
	async displayReport(report: RepositoryAnalysisReport, context: vscode.ExtensionContext): Promise<void> {
		// Create webview panel
		const panel = vscode.window.createWebviewPanel(
			"repositoryAnalysisReport",
			"Vibe Coding Analysis Report",
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [context.extensionUri],
			},
		)

		// Set webview content
		panel.webview.html = this.generateReportHtml(report, panel.webview, context.extensionUri)

		// Handle messages from webview
		panel.webview.onDidReceiveMessage((message) => {
			switch (message.command) {
				case "openFile":
					if (message.file) {
						vscode.workspace.openTextDocument(message.file).then((doc) => {
							vscode.window.showTextDocument(doc, {
								selection: new vscode.Range(
									new vscode.Position(message.line || 0, 0),
									new vscode.Position(message.line || 0, 0),
								),
							})
						})
					}
					break
			}
		})
	}

	/**
	 * Generate HTML for repository analysis report
	 * @param report Repository analysis report
	 * @param webview VS Code webview
	 * @param extensionUri VS Code extension URI
	 * @returns HTML content
	 */
	private generateReportHtml(
		report: RepositoryAnalysisReport,
		webview: vscode.Webview,
		extensionUri: vscode.Uri,
	): string {
		// Get CSS URI
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "webview-ui", "src", "index.css"))

		// Generate score color
		const scoreColor = this.getScoreColor(report.overallScore)

		// Generate language analysis HTML
		const languageAnalysisHtml = Object.entries(report.languageAnalyses)
			.map(([language, analysis]) => {
				const languageScoreColor = this.getScoreColor(analysis.score)

				return `
          <div class="language-analysis">
            <h3>${language.toUpperCase()} (${analysis.score.toFixed(1)}/10)</h3>
            <div class="metrics">
              <div class="metric">
                <span class="metric-name">Complexity:</span>
                <span class="metric-value" style="color: ${this.getScoreColor(analysis.metrics.complexity)}">${analysis.metrics.complexity.toFixed(1)}/10</span>
              </div>
              <div class="metric">
                <span class="metric-name">Documentation:</span>
                <span class="metric-value" style="color: ${this.getScoreColor(analysis.metrics.documentation)}">${analysis.metrics.documentation.toFixed(1)}/10</span>
              </div>
              <div class="metric">
                <span class="metric-name">Structure:</span>
                <span class="metric-value" style="color: ${this.getScoreColor(analysis.metrics.structure)}">${analysis.metrics.structure.toFixed(1)}/10</span>
              </div>
            </div>
            ${
				analysis.messages.length > 0
					? `
              <div class="messages">
                <h4>Issues:</h4>
                <ul>
                  ${analysis.messages
						.map(
							(message) => `
                    <li class="message ${message.severity}">
                      ${
							message.file
								? `
                        <a href="#" class="file-link" data-file="${message.file}" data-line="${message.line || 0}">
                          ${path.basename(message.file)}${message.line ? `:${message.line}` : ""}
                        </a>: 
                      `
								: ""
						}
                      ${message.message}
                    </li>
                  `,
						)
						.join("")}
                </ul>
              </div>
            `
					: ""
			}
          </div>
        `
			})
			.join("")

		// Generate recommendations HTML
		const recommendationsHtml = report.recommendations
			.sort((a, b) => {
				const priorityOrder = { high: 0, medium: 1, low: 2 }
				return priorityOrder[a.priority] - priorityOrder[b.priority]
			})
			.map(
				(recommendation) => `
        <li class="recommendation ${recommendation.priority}">
          <span class="priority">[${recommendation.priority.toUpperCase()}]</span>
          ${recommendation.language ? `<span class="language">[${recommendation.language}]</span>` : ""}
          ${
				recommendation.file
					? `
            <a href="#" class="file-link" data-file="${recommendation.file}" data-line="${recommendation.line || 0}">
              ${path.basename(recommendation.file)}${recommendation.line ? `:${recommendation.line}` : ""}
            </a>: 
          `
					: ""
			}
          ${recommendation.message}
        </li>
      `,
			)
			.join("")

		// Generate HTML
		return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vibe Coding Analysis Report</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.5;
          }
          
          h1, h2, h3, h4 {
            color: var(--vscode-editor-foreground);
            margin-top: 20px;
            margin-bottom: 10px;
          }
          
          .score-container {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .score {
            font-size: 48px;
            font-weight: bold;
            margin-right: 20px;
            color: ${scoreColor};
          }
          
          .score-label {
            font-size: 16px;
            color: var(--vscode-descriptionForeground);
          }
          
          .language-analysis {
            margin-bottom: 30px;
            padding: 15px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 5px;
          }
          
          .metrics {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .metric {
            background-color: var(--vscode-editor-background);
            padding: 8px 12px;
            border-radius: 4px;
          }
          
          .metric-name {
            font-weight: bold;
            margin-right: 5px;
          }
          
          .messages ul, .recommendations ul {
            padding-left: 20px;
          }
          
          .message, .recommendation {
            margin-bottom: 8px;
          }
          
          .message.high, .recommendation.high {
            color: #ff5252;
          }
          
          .message.medium, .recommendation.medium {
            color: #ffab40;
          }
          
          .message.low, .recommendation.low {
            color: #69f0ae;
          }
          
          .priority {
            font-weight: bold;
            margin-right: 5px;
          }
          
          .language {
            font-style: italic;
            margin-right: 5px;
            color: var(--vscode-descriptionForeground);
          }
          
          .file-link {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
          }
          
          .file-link:hover {
            text-decoration: underline;
          }
          
          .summary, .readability {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            white-space: pre-wrap;
          }
          
          .timestamp {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <h1>Vibe Coding Analysis Report</h1>
        
        <div class="score-container">
          <div class="score">${report.overallScore.toFixed(1)}</div>
          <div class="score-label">
            <div>Overall "Vibe Coding" Score</div>
            <div>(0-10, higher is better)</div>
          </div>
        </div>
        
        <h2>Summary</h2>
        <div class="summary">
          ${report.llmSummary}
        </div>
        
        <h2>Readability Assessment</h2>
        <div class="readability">
          ${report.llmReadability}
        </div>
        
        <h2>Language Analysis</h2>
        ${languageAnalysisHtml}
        
        <h2>Recommendations</h2>
        <ul class="recommendations">
          ${recommendationsHtml}
        </ul>
        
        <div class="timestamp">
          Report generated on ${new Date(report.timestamp).toLocaleString()}
        </div>
        
        <script>
          (function() {
            // Handle file link clicks
            document.querySelectorAll('.file-link').forEach(link => {
              link.addEventListener('click', (e) => {
                e.preventDefault();
                const file = e.target.getAttribute('data-file');
                const line = parseInt(e.target.getAttribute('data-line'), 10);
                
                // Send message to extension
                vscode.postMessage({
                  command: 'openFile',
                  file: file,
                  line: line
                });
              });
            });
            
            // Get VSCode API
            const vscode = acquireVsCodeApi();
          })();
        </script>
      </body>
      </html>
    `
	}

	/**
	 * Estimate readability score from LLM assessment
	 * @param llmReadability LLM readability assessment
	 * @returns Estimated score (0-10)
	 */
	private estimateReadabilityScore(llmReadability: string): number {
		// Simple heuristic: look for positive/negative keywords
		const positiveKeywords = [
			"well-structured",
			"clear",
			"readable",
			"organized",
			"consistent",
			"excellent",
			"good",
			"great",
			"impressive",
			"clean",
			"maintainable",
		]

		const negativeKeywords = [
			"complex",
			"confusing",
			"difficult",
			"inconsistent",
			"poor",
			"challenging",
			"messy",
			"disorganized",
			"hard to understand",
			"unclear",
		]

		// Count keyword occurrences
		const positiveCount = positiveKeywords.reduce(
			(count, keyword) => count + (llmReadability.toLowerCase().includes(keyword) ? 1 : 0),
			0,
		)

		const negativeCount = negativeKeywords.reduce(
			(count, keyword) => count + (llmReadability.toLowerCase().includes(keyword) ? 1 : 0),
			0,
		)

		// Calculate score
		const totalKeywords = positiveCount + negativeCount
		if (totalKeywords === 0) {
			return 5 // Neutral score if no keywords found
		}

		const positiveRatio = positiveCount / totalKeywords
		return 5 + positiveRatio * 5
	}

	/**
	 * Get color for score
	 * @param score Score (0-10)
	 * @returns Color in hex format
	 */
	private getScoreColor(score: number): string {
		if (score >= 8) {
			return "#69f0ae" // Green
		} else if (score >= 6) {
			return "#ffab40" // Orange
		} else {
			return "#ff5252" // Red
		}
	}
}
