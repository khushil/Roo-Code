# Repository Analysis for "Vibe Coding" Feature

This document provides instructions for building, testing, and using the Repository Analysis feature in Roo Code.

## Overview

The Repository Analysis feature analyzes a software repository for its suitability for "vibe coding" - collaborative software development between a human engineer and the Roo Code AI assistant, primarily leveraging Anthropic's Claude models. The analysis provides insights into how well the codebase is structured for effective interaction with Roo Code and identifies areas for improvement.

## Directory Structure

The feature is implemented in the following directory structure:

```
src/
  integrations/
    repository-analysis/              # Main feature directory
      index.ts                        # Main export file
      command-handler.ts              # Command registration and handling
      language-detector.ts            # Language detection module
      types.ts                        # Common types and interfaces
      code-analyzer/                  # Code analysis modules
        index.ts                      # Factory and common interfaces
        base-analyzer.ts              # Base class for all analyzers
        javascript-analyzer.ts        # JavaScript/TypeScript analyzer
        python-analyzer.ts            # Python analyzer
        java-analyzer.ts              # Java analyzer
        generic-analyzer.ts           # Generic analyzer for unsupported languages
      llm-integration/                # LLM integration modules
        index.ts                      # LLM integration interfaces
      report-generator/               # Report generation modules
        index.ts                      # Report generation interfaces
      configuration/                  # Configuration modules
        index.ts                      # Configuration interfaces
```

## Building and Testing

### Prerequisites

- Node.js (version 20.18.1 or higher)
- npm (version 10.x or higher)
- VS Code (version 1.84.0 or higher)

### Building the Extension

All commands should be run from the root directory of the Roo Code project (`/Users/khushildep/src/Roo-Code`):

1. **Install Dependencies**:

    ```bash
    cd /Users/khushildep/src/Roo-Code
    npm run install:all
    ```

2. **Compile the Extension**:

    ```bash
    cd /Users/khushildep/src/Roo-Code
    npm run compile
    ```

3. **Build the Extension**:
    ```bash
    cd /Users/khushildep/src/Roo-Code
    npm run build
    ```
    This will create a `.vsix` file in the `bin` directory.

### Testing in Development Mode

1. **Start the Extension in Development Mode**:

    - Open the Roo Code project in VS Code:
        ```bash
        cd /Users/khushildep/src/Roo-Code
        code .
        ```
    - Press `F5` to launch a new VS Code instance with the extension loaded
    - Alternatively, run the "Run Extension" launch configuration from the Debug panel

2. **Run the Repository Analysis Command**:

    - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS)
    - Type "Roo Code: Analyze Repository for Vibe Coding" and select it
    - Follow the prompts to select a repository to analyze

3. **Configure the Analysis Settings** (Optional):
    - Open VS Code Settings (`Ctrl+,` or `Cmd+,` on macOS)
    - Search for "Roo Code Repository Analysis"
    - Adjust settings like include/exclude patterns, LLM profiles, and sampling strategy

### Testing with Different Repositories

For comprehensive testing, try analyzing repositories with different characteristics:

1. **JavaScript/TypeScript Repository**:

    - Test with a Node.js or React project
    - Verify that ESLint analysis works correctly

2. **Python Repository**:

    - Test with a Python project
    - Verify that Pylint analysis works correctly (if Pylint is installed)

3. **Java Repository**:

    - Test with a Java project
    - Verify that Checkstyle analysis works correctly (if Checkstyle is installed)

4. **Mixed-Language Repository**:

    - Test with a project containing multiple languages
    - Verify that language detection works correctly
    - Check that appropriate analyzers are used for each language

5. **Large Repository**:
    - Test with a large repository (1000+ files)
    - Verify that chunking and sampling work correctly
    - Check performance and memory usage

### Debugging

If you encounter issues:

1. **Check the Output Panel**:

    - Open the Output panel (`Ctrl+Shift+U` or `Cmd+Shift+U` on macOS)
    - Select "Roo-Code" from the dropdown
    - Look for error messages or warnings

2. **Debug Mode**:

    - Set breakpoints in the repository analysis code
    - Launch the extension in debug mode (F5)
    - Step through the code to identify issues

3. **Common Issues**:
    - Missing dependencies for language-specific analyzers (ESLint, Pylint, Checkstyle)
    - LLM API configuration issues
    - File access permissions

### Unit Testing

To run unit tests for the repository analysis feature:

1. **Create Test Files**:

    ```bash
    cd /Users/khushildep/src/Roo-Code
    mkdir -p src/__tests__/integrations/repository-analysis
    ```

2. **Write Tests**:
   Create test files in `src/__tests__/integrations/repository-analysis/` for:

    - Language detection
    - Code analysis
    - Report generation

3. **Run Tests**:
    ```bash
    cd /Users/khushildep/src/Roo-Code
    npm run test:extension
    ```

### Packaging for Distribution

When you're ready to distribute the extension with the new feature:

1. **Package the Extension**:

    ```bash
    cd /Users/khushildep/src/Roo-Code
    npm run vsix
    ```

2. **Install the Packaged Extension**:
    - In VS Code, go to the Extensions view
    - Click the "..." menu and select "Install from VSIX..."
    - Navigate to the `bin` directory and select the `.vsix` file

## Configuration Options

The Repository Analysis feature can be configured through VS Code settings:

- `roo-cline.repositoryAnalysis.includePatterns`: Glob patterns for files to include in analysis
- `roo-cline.repositoryAnalysis.excludePatterns`: Glob patterns for files to exclude from analysis
- `roo-cline.repositoryAnalysis.summaryLlmProfile`: LLM profile for generating codebase summary
- `roo-cline.repositoryAnalysis.readabilityLlmProfile`: LLM profile for assessing code readability
- `roo-cline.repositoryAnalysis.recommendationsLlmProfile`: LLM profile for generating recommendations
- `roo-cline.repositoryAnalysis.enabledAnalyzers`: Enabled code analyzers
- `roo-cline.repositoryAnalysis.maxFilesPerChunk`: Maximum files to analyze in one chunk
- `roo-cline.repositoryAnalysis.samplingStrategy`: Strategy for sampling files in large repositories
- `roo-cline.repositoryAnalysis.samplingPercentage`: Percentage of files to sample

## Using the Feature

1. **Open a Repository**:

    - Open a repository in VS Code
    - Alternatively, you can select a repository when running the command

2. **Run the Analysis Command**:

    - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS)
    - Type "Roo Code: Analyze Repository for Vibe Coding" and select it
    - If no repository is open, you'll be prompted to select one

3. **View the Analysis Report**:

    - The analysis will run in the background with progress updates
    - When complete, a report will be displayed in a VS Code webview
    - The report includes:
        - Overall "Vibe Coding" score
        - Language-specific analysis results
        - LLM-generated summary and readability assessment
        - Prioritized recommendations for improvement

4. **Interpret the Results**:
    - Higher scores indicate better suitability for "vibe coding"
    - Review the recommendations to improve your codebase
    - Click on file links in the report to navigate to specific files

## Troubleshooting

### Language-Specific Analyzers

- **JavaScript/TypeScript (ESLint)**:

    - Ensure ESLint is installed: `npm install -g eslint`
    - Check for an `.eslintrc` file in the repository

- **Python (Pylint)**:

    - Ensure Pylint is installed: `pip install pylint`
    - Check for a `.pylintrc` file in the repository

- **Java (Checkstyle)**:
    - Ensure Java is installed
    - Ensure Checkstyle is installed and available in the PATH
    - Check for a `checkstyle.xml` file in the repository

### LLM Integration

- Ensure you have configured LLM profiles in Roo Code settings
- Check your API keys for the selected LLM profiles
- For Claude models, ensure your Anthropic API key is valid

### Performance Issues

- For large repositories, try reducing the sampling percentage
- Exclude large binary files and generated code using exclude patterns
- Increase the `maxFilesPerChunk` setting if you have sufficient memory
