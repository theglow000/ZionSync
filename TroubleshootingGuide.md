# ZionSync Troubleshooting Guide

## Interaction Process in VS Code Environment

1. **Problem Description**
   - User describes the issue with specific details
   - Identifies affected functionality and expected behavior

2. **Investigation Cycle**
   - Assistant provides CLI commands (for VS Code terminal) or file navigation instructions
   - User executes commands/navigation and shares results
   - Assistant can request to examine specific files in the project
   - VS Code-specific tools like Search Across Files can be utilized
   - This cycle repeats until reaching 90-95% confidence in a solution

3. **Solution Proposal**
   - Assistant presents a detailed solution plan
   - Includes confidence percentage
   - Explains reasoning and expected outcomes
   - No code solutions are provided at this stage

4. **Solution Approval**
   - User reviews the proposed solution
   - User either approves or requests further investigation
   - Only upon approval does the process move forward

5. **Code Implementation**
   - Assistant provides the actual code changes
   - Uses appropriate Markdown code blocks with file paths
   - VS Code can directly navigate to these files for editing

6. **Verification**
   - User applies the changes (can use VS Code's editing features)
   - Tests the functionality to verify the fix
   - Reports back on the results

## VS Code Integration Advantages

- Use VS Code's terminal for running commands
- Leverage file explorer for quick navigation
- Utilize search functionality for project-wide queries
- Take advantage of side-by-side file comparison
- Use VS Code's debugging tools if needed
- Access Git history directly within VS Code

## Important Rules

- Always use best coding practice.
- Make informed decisions.
- No solution code is provided until explicit approval from the user
- Investigation continues until reaching high confidence (90-95%)
- Each step builds on information gathered from previous steps
- All analysis and reasoning is made transparent to the user

## Notes on Command Output

- For large projects, directory listing commands may produce outputs too large for chat windows
- Use more specific search queries or file pattern matching instead
- Consider using VS Code's search functionality (Ctrl+Shift+F) for targeted file content searches
- Break down large investigations into smaller, focused queries