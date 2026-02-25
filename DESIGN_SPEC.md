# 3D Spreadsheet UI/UX Design Specification

## Overview
This document outlines the interaction model and visual design for a 3D spreadsheet application, specifically focusing on the execution of algorithms (e.g., descriptive statistics, regression) and the visualization of their results (text/markdown and plots). The goal is to leverage the Z-axis and spatial memory to create a workspace that is more intuitive, less cluttered, and more powerful than traditional 2D dashboards.

---

## 1. Displaying Results (Plots and Text) in 3D
Instead of flat, overlapping windows, results are presented on **"Artifact Boards"**—sleek, volumetric backplates (e.g., frosted glass or dark slate materials with subtle edge lighting). 

*   **Volumetric Hierarchy:** Text results (markdown, summary stats) sit slightly raised off the backplate, while 3D plots (scatter plots, surface plots) project outward from the board, utilizing true 3D space.
*   **Progress Indication:** When an algorithm runs, a volumetric progress indicator (e.g., a glowing ring or a particle stream) appears on the board. As data streams in, the text and plots dynamically build themselves in 3D space.
*   **Ease of Use:** Users can grab the edge of an Artifact Board to move it around the scene or scale it up/down. The 3D nature allows users to physically lean in (zoom) to see details without losing the context of the surrounding workspace.

## 2. Displaying Multiple Plots within an Artifact
A single algorithm run often generates multiple plots (e.g., a regression might yield a scatter plot, a residuals plot, and a QQ plot). 

*   **The 3D Carousel / Tabbed Prism:** Instead of traditional flat tabs, the Artifact Board features a "Prism" or "Carousel" component. 
*   **Interaction:** The user sees the primary plot. Below or to the side of the plot, small 3D holographic thumbnails represent the other available plots. Clicking a thumbnail smoothly rotates the prism or cross-fades the hologram to bring the new plot to the forefront.
*   **Expansion:** A "Shatter" or "Expand" button allows the user to break the single view into a grid. The backplate dynamically expands, and all plots are laid out side-by-side on the same unified board for simultaneous viewing.

## 3. Unification of Analysis Results and Plots
The text results and the plots are fundamentally linked to the algorithm run. They must be unified.

*   **The Unified Backplate:** Every algorithm run generates exactly *one* Artifact Board. The left side of the board contains the configuration parameters and text/markdown results. The right side contains the plot viewer (the 3D Carousel).
*   **View Modes:**
    *   *Compact Mode:* Only the summary text and the primary plot are visible.
    *   *Expanded Mode:* The board widens to show the full markdown report and the expanded grid of all plots.
    *   *Focus Mode:* The user can "pop out" a specific plot from the board. A tether (a subtle, glowing spline) remains connected between the popped-out plot and the parent Artifact Board to maintain visual context.

## 4. Positioning in 3D Space
The 3D space is organized into distinct functional zones to prevent clutter:

*   **The Data Plane (Left/Center):** The 3D spreadsheet itself. It is anchored to the floor plane and angled slightly upward for ergonomics, taking up the left half of the visual field.
*   **The Active Workspace (Right):** The right half of the screen is dedicated to the *Active Artifact*. When an algorithm is run, its Artifact Board spawns here, facing the user at a comfortable reading angle.
*   **The Archive / Depth Plane (Z-Axis / Background):** Previous runs are pushed back along the Z-axis (deeper into the screen).

## 5. Handling Multiple Algorithm Runs (The Z-Axis Archive)
As the user runs multiple algorithms, the workspace must not become a cluttered mess of overlapping windows. We use the Z-axis to manage history.

*   **The Rolodex / Depth Stacking:** When a new algorithm is run, the currently active Artifact Board smoothly animates backward into the Z-axis, shrinking slightly and dimming (losing opacity or becoming wireframe/ghosted). 
*   **Visual Stacking:** Previous artifacts stack behind the active one, like a deck of cards viewed from a slight angle. The user can see the edges and titles of previous runs.
*   **The "Behind the Table" Tab System:** Alternatively, older artifacts can slide *down and behind* the main spreadsheet. Their top edges peek out above the spreadsheet like physical file folders. Hovering over a tab raises it slightly; clicking it brings it to the Active Workspace.

## 6. UI Behavior on Creation and Selection
The choreography of the UI is crucial for maintaining spatial awareness.

*   **On New Creation:**
    1. The user configures the algorithm via a floating command palette or a side panel attached to the spreadsheet.
    2. The current Active Artifact (if any) smoothly glides backward into the Depth Stack.
    3. A new, blank Artifact Board materializes in the Active Workspace (Right side).
    4. Streaming indicators appear, and the new results populate the board.
*   **On Selection (Recalling an old artifact):**
    1. The user clicks a ghosted artifact in the Depth Stack (or a tab behind the table).
    2. The currently Active Artifact glides back into its chronological place in the stack.
    3. The selected artifact glides forward from the background, scaling up to full size, regaining full opacity and color, and snapping into the Active Workspace.
    4. *Optional:* The spreadsheet itself can highlight the columns/rows that were used as inputs for that specific recalled artifact, creating a powerful visual link between the data and the result.
