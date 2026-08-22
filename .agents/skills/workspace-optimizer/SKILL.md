---
name: workspace-optimizer
description: An automated front-end engineering agent skill configured to design balanced, high-density dashboard layouts using Ant Design and modern UI systems. Minimizes deep scrolling while allowing a shallow, comfortable vertical flow.
---

# Workspace Optimizer

## Description
An automated front-end engineering agent skill configured to design balanced, high-density dashboard layouts using Ant Design. It minimizes deep scrolling while allowing a shallow, comfortable vertical flow.

## Triggers
- "optimize front-end space"
- "create high density layout"
- "fix deep scrolling"
- "hide data until toggle"

## Rules & Layout Constraints
1. **Shallow Scrolling Only:** Allow a light vertical scroll path. Limit total page content to a maximum height of 150vh to 180vh (roughly 1.5 to 2 screen lengths). Never let pages drift into endless deep scrolling.
2. **Above-the-Fold Priority:** Force primary visual charts, metrics tabs, and interactive layout toggles into the first 100vh viewport so they are instantly visible without scrolling.
3. **Stacked Dashboard Rows:** Group content into exactly two horizontal blocks:
   - *Row 1 (Above the fold):* Main visualization tabs and real-time canvas metrics.
   - *Row 2 (Below the fold):* Supporting data tables, detailed logs, or secondary historical graphs.
4. **Contextual Collapsing:** Use AntD `<Collapse>` accordions or dynamic sidebars for text-heavy metadata below the fold, keeping the secondary section tightly organized.
5. **Density Toggles:** Maintain a header `<Switch>` component to collapse secondary rows or side sections instantly, letting the user toggle between a single tight viewport or a shallow 2-row layout.

## Execution Workflow
1. Map out core visualizations vs. supporting textual data metrics.
2. Structure a 2-tier vertical row grid layout template.
3. Output copy-pasteable React + modern component architectures that respect the shallow height limits.
