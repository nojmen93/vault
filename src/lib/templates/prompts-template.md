# AI Coding Tool Prompts

Optimized prompts for different AI coding assistants. Copy and paste the appropriate prompt for your tool.

---

## Claude Code (Full Context)

Use this with Claude Code for comprehensive project setup:

```
You are working on {project_name} — {project_description}

Tech Stack: {tech_stack}

BEFORE STARTING:
1. Read CLAUDE.md for build commands and coding standards
2. Read ARCHITECTURE.md for system design
3. Check ROADMAP.md for current priorities

CODING RULES:
- TypeScript strict mode, explicit return types
- Server Components by default
- Tailwind for styling
- Result pattern for error handling
- Environment variables for secrets

CURRENT TASK:
{current_task}

FILE STRUCTURE:
- src/app/ — routes
- src/components/ — React components
- src/lib/ — utilities
- src/actions/ — server actions

Ask clarifying questions if requirements are ambiguous.
```

---

## Lovable

Optimized for Lovable's format:

```
Build a {app_type} app called {project_name}.

Tech: {tech_stack}

Features:
- {feature_1}
- {feature_2}
- {feature_3}

Style: {design_style}

Start with {first_component}
```

---

## Bolt

Optimized for Bolt's format:

```
Create {project_name}: {one_liner}

Stack: {tech_stack}

Pages:
- {page_1}
- {page_2}
- {page_3}

Components:
- {component_1}
- {component_2}
- {component_3}

Data Models:
- {model_1}: {fields_1}
- {model_2}: {fields_2}
```

---

## Cursor

Optimized for Cursor:

```
Project: {project_name}
Description: {project_description}

Stack: {tech_stack}

Key Features:
1. {feature_1}
2. {feature_2}
3. {feature_3}

Project Structure:
{project_structure}

Coding Standards:
- TypeScript with strict mode
- Functional components with hooks
- Tailwind for styling
- Server actions for mutations

Current Focus: {current_focus}
```

---

## v0 (UI-Focused)

Optimized for v0's UI generation:

```
Design a {component_type} for {project_name}.

Style: {design_aesthetic}

Include:
- {element_1}
- {element_2}
- {element_3}

Functionality:
- {interaction_1}
- {interaction_2}

Color scheme: {colors}
```

---

## Windsurf

Optimized for Windsurf:

```
Build {project_name}: {project_description}

Stack:
- Frontend: {frontend}
- Backend: {backend}
- Database: {database}
- Auth: {auth}

Core Features:
{features_list}

Development Approach:
- Start with {starting_point}
- Then add {second_priority}
- Finally {third_priority}
```

---

## Replit Agent

Optimized for Replit:

```
Create a {app_type} called {project_name}.

What it does: {project_description}

Main features:
- {feature_1}
- {feature_2}
- {feature_3}

Use {tech_stack} for the stack.

Start by setting up the basic structure, then implement features one by one.
```

---

## Usage Tips

1. **Copy the relevant prompt** for your chosen tool
2. **Replace placeholders** with your project specifics
3. **Add context** as needed for complex features
4. **Iterate** - start simple, add complexity gradually

## Customization

Adjust prompts based on:
- Tool's context window size
- Project complexity
- Specific features needed
- Design requirements
