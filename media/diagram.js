// Diagram renderer for ExpressWebJs object relationships
(function () {
  // VS Code API for posting messages to the extension
  const vscode = acquireVsCodeApi();

  // DOM Elements
  const diagram = document.getElementById("diagram");
  const directorySearch = document.getElementById("directory-search");
  const fileSearch = document.getElementById("file-search");
  const searchButton = document.getElementById("search-button");
  const resetSearchButton = document.getElementById("reset-search");
  const includeRelatedCheckbox = document.getElementById("include-related");
  const toggleMethodsCheckbox = document.getElementById("toggle-methods");
  const togglePropertiesCheckbox = document.getElementById("toggle-properties");
  const loadingOverlay = document.getElementById("loading-overlay");
  const errorMessage = document.getElementById("error-message");
  const nodesCount = document.getElementById("nodes-count");
  const edgesCount = document.getElementById("edges-count");
  const groupingSelect = document.getElementById("grouping-select");
  const expandGroupsCheckbox = document.getElementById("expand-groups");
  const exportSvgButton = document.getElementById("export-svg");
  const exportPngButton = document.getElementById("export-png");
  const refreshButton = document.getElementById("refresh");
  const zoomInButton = document.getElementById("zoom-in");
  const zoomOutButton = document.getElementById("zoom-out");
  const zoomFitButton = document.getElementById("zoom-fit");
  const relationshipCheckboxes = document.querySelectorAll("input[name='relationship-type']");

  // Define default state
  const defaultState = {
    data: null,
    showMethods: true,
    showProperties: true,
    zoomLevel: 1,
    grouping: "none",
    expandedGroups: new Set(),
    enabledRelationships: ["extends", "implements", "depends on", "imports", "instantiates"],
  };

  // State management
  let state = JSON.parse(JSON.stringify(defaultState));

  // Try to restore state from storage
  try {
    const previousState = vscode.getState();
    if (previousState) {
      // First create a fresh state with defaults
      state = { ...defaultState };

      // Then copy over saved properties
      Object.keys(previousState).forEach((key) => {
        if (key !== "renderer") {
          if (key === "expandedGroups" && Array.isArray(previousState[key])) {
            // Convert array back to Set
            state.expandedGroups = new Set(previousState[key]);
          } else {
            state[key] = previousState[key];
          }
        }
      });

      console.log("Restored previous state:", {
        hasData: !!state.data,
        showMethods: state.showMethods,
        showProperties: state.showProperties,
        enabledRelationships: state.enabledRelationships,
        grouping: state.grouping,
        expandedGroups: Array.from(state.expandedGroups),
      });
    }
  } catch (error) {
    console.error("Error restoring state:", error);
  }

  // Function to persist state
  function persistState() {
    try {
      // Make a copy of the state without circular references
      const stateToStore = {
        ...state,
        data: state.data
          ? {
              nodes: state.data.nodes,
              edges: state.data.edges,
            }
          : null,
        expandedGroups: Array.from(state.expandedGroups),
        renderer: null, // Don't store renderer
      };

      vscode.setState(stateToStore);
      console.log("State persisted:", {
        grouping: stateToStore.grouping,
        expandedGroups: stateToStore.expandedGroups,
      });
    } catch (error) {
      console.error("Error persisting state:", error);
    }
  }

  // Add this to your initialization code, after DOM elements are initialized
  let metricsPanel;

  // Initialize UI based on state
  function initializeUI() {
    if (toggleMethodsCheckbox) toggleMethodsCheckbox.checked = state.showMethods;
    if (togglePropertiesCheckbox) togglePropertiesCheckbox.checked = state.showProperties;
    if (groupingSelect) {
      // Set initial value based on state
      groupingSelect.value = state.grouping || "none";

      // Add change handler
      groupingSelect.addEventListener("change", function () {
        state.grouping = groupingSelect.value;

        // When grouping changes, clear expanded groups to avoid stale references
        state.expandedGroups = new Set();

        persistState();
        renderDiagram();
      });
    }
    if (expandGroupsCheckbox) expandGroupsCheckbox.checked = true;

    // Initialize relationship checkboxes
    relationshipCheckboxes.forEach((checkbox) => {
      checkbox.checked = state.enabledRelationships.includes(checkbox.value);
    });

    // Create metrics panel
    metricsPanel = createMetricsPanel();
  }

  // Set up event listeners
  function setupEventListeners() {
    // Search functionality
    if (searchButton) {
      searchButton.addEventListener("click", function () {
        performSearch();
      });
    }

    if (resetSearchButton) {
      resetSearchButton.addEventListener("click", resetSearch);
    }

    if (fileSearch) {
      fileSearch.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
          performSearch();
        }
      });
    }

    if (directorySearch) {
      directorySearch.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
          performSearch();
        }
      });
    }

    // Toggle displays
    if (toggleMethodsCheckbox) {
      toggleMethodsCheckbox.addEventListener("change", function () {
        state.showMethods = this.checked;
        persistState();
        renderDiagram();
      });
    }

    if (togglePropertiesCheckbox) {
      togglePropertiesCheckbox.addEventListener("change", function () {
        state.showProperties = this.checked;
        persistState();
        renderDiagram();
      });
    }

    // Grouping
    if (groupingSelect) {
      groupingSelect.addEventListener("change", function () {
        state.grouping = this.value;
        persistState();
        renderDiagram();
      });
    }

    if (expandGroupsCheckbox) {
      expandGroupsCheckbox.addEventListener("change", function () {
        state.expandGroups = this.checked;
        persistState();
        renderDiagram();
      });
    }

    // Relationship filters
    relationshipCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        updateRelationshipFilters();
      });
    });

    // Export functionality
    if (exportSvgButton) {
      exportSvgButton.addEventListener("click", () => exportDiagram("svg"));
    }

    if (exportPngButton) {
      exportPngButton.addEventListener("click", () => exportDiagram("png"));
    }

    // Zoom controls
    if (zoomInButton) {
      zoomInButton.addEventListener("click", zoomIn);
    }

    if (zoomOutButton) {
      zoomOutButton.addEventListener("click", zoomOut);
    }

    if (zoomFitButton) {
      zoomFitButton.addEventListener("click", zoomToFit);
    }

    // Refresh button
    if (refreshButton) {
      refreshButton.addEventListener("click", refreshDiagram);
    }

    // Collapse all button
    const collapseAllButton = document.getElementById("collapse-all");
    if (collapseAllButton) {
      collapseAllButton.addEventListener("click", function () {
        state.expandedGroups.clear();
        persistState();
        renderDiagram();
      });
    }
  }

  // Function to perform search
  function performSearch() {
    const directory = directorySearch ? directorySearch.value.trim() : "";
    const fileName = fileSearch ? fileSearch.value.trim() : "";
    const includeRelatedNodes = includeRelatedCheckbox ? includeRelatedCheckbox.checked : true;

    updateLoadingState(true);

    vscode.postMessage({
      command: "search",
      criteria: {
        includeAll: !directory && !fileName,
        directory: directory || undefined,
        fileName: fileName || undefined,
        includeRelatedNodes,
      },
    });
  }

  // Function to reset search
  function resetSearch() {
    directorySearch.value = "";
    fileSearch.value = "";

    updateLoadingState(true);

    vscode.postMessage({
      command: "search",
      criteria: {
        includeAll: true,
      },
    });
  }

  // Function to update relationship filters
  function updateRelationshipFilters() {
    state.enabledRelationships = Array.from(relationshipCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    persistState();
    renderDiagram();
  }

  // Function to export diagram
  function exportDiagram(format) {
    const svg = document.getElementById("diagram");

    if (format === "svg") {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);

      vscode.postMessage({
        command: "export-diagram",
        format: "svg",
        data: svgString,
      });
    } else if (format === "png") {
      // For PNG export, create a canvas and draw the SVG to it
      const canvas = document.createElement("canvas");
      const svgRect = svg.getBoundingClientRect();

      // Set canvas dimensions to SVG dimensions
      canvas.width = svgRect.width;
      canvas.height = svgRect.height;

      // Create an image from the SVG
      const img = new Image();
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = function () {
        // Draw the image on the canvas
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Convert canvas to PNG data URL
        const pngDataUrl = canvas.toDataURL("image/png");

        // Send to extension
        vscode.postMessage({
          command: "export-diagram",
          format: "png",
          data: pngDataUrl,
        });

        // Clean up
        URL.revokeObjectURL(url);
      };

      img.src = url;
    }
  }

  // Function to refresh diagram
  function refreshDiagram() {
    updateLoadingState(true);

    vscode.postMessage({
      command: "refresh",
    });
  }

  // Zoom functions
  function zoomIn() {
    if (!state.renderer || !state.renderer.zoomBehavior) return;

    const svg = d3.select("#diagram");
    svg.transition().call(state.renderer.zoomBehavior.scaleBy, 1.2);
  }

  function zoomOut() {
    if (!state.renderer || !state.renderer.zoomBehavior) return;

    const svg = d3.select("#diagram");
    svg.transition().call(state.renderer.zoomBehavior.scaleBy, 0.8);
  }

  function zoomToFit() {
    if (!state.renderer || !state.renderer.zoomBehavior || !state.renderer.graph) return;

    const svg = d3.select("#diagram");
    const width = diagram.clientWidth;
    const height = diagram.clientHeight;
    const g = state.renderer.graph;

    const graphWidth = g.graph().width || width;
    const graphHeight = g.graph().height || height;

    const scale = Math.min(width / graphWidth, height / graphHeight) * 0.9;
    const translate = [(width - graphWidth * scale) / 2, (height - graphHeight * scale) / 2];

    svg.transition().duration(500).call(state.renderer.zoomBehavior.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
  }

  // Function to update loading state
  function updateLoadingState(isLoading) {
    if (loadingOverlay) {
      loadingOverlay.classList.toggle("hidden", !isLoading);
    }
  }

  // Function to show error
  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.classList.remove("hidden");
    }

    updateLoadingState(false);
  }

  // Function to hide error
  function hideError() {
    if (errorMessage) {
      errorMessage.classList.add("hidden");
    }
  }

  // Helper function to escape HTML
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // Function to get relationship CSS classes
  function getRelationshipClasses(relationship) {
    // Normalize the relationship string to create valid CSS classes
    const normalizedRelationship = relationship.toLowerCase().replace(/\s+/g, "-");

    return {
      edgeClass: `${normalizedRelationship}-path`,
      labelClass: `${normalizedRelationship}-label`,
    };
  }

  // Function to get node style
  function getNodeStyle(type) {
    switch (type) {
      case "Model":
        return { fill: "rgba(71, 125, 192, 0.2)" };
      case "Repository":
        return { fill: "rgba(208, 145, 68, 0.2)" };
      case "Service":
        return { fill: "rgba(126, 179, 106, 0.2)" };
      case "Controller":
        return { fill: "rgba(198, 79, 77, 0.2)" };
      case "Middleware":
        return { fill: "rgba(139, 103, 173, 0.2)" };
      default:
        return { fill: "rgba(112, 153, 166, 0.2)" };
    }
  }

  // Function to create node label
  function createNodeLabel(node) {
    // Create header with node name
    const header = `<div style="font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px; margin-bottom: 5px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
      ${escapeHtml(node.name)}
    </div>`;

    // Create directory info
    const directoryInfo = `<div style="font-size: 11px; opacity: 0.8; margin-bottom: 5px;">
      ${escapeHtml(node.directory)}
    </div>`;

    // Create methods list if enabled and available
    let methodsList = "";
    if (state.showMethods && node.methods && node.methods.length > 0) {
      const methodsToShow = node.methods.slice(0, 5); // Show only first 5 methods
      const methodItems = methodsToShow.map((method) => `<div style="font-size: 11px; color: #7eb36a;">${escapeHtml(method)}()</div>`).join("");

      methodsList = `<div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);">
        ${methodItems}
        ${node.methods.length > 5 ? `<div style="font-size: 10px; opacity: 0.7;">${node.methods.length - 5} more...</div>` : ""}
      </div>`;
    }

    // Create properties list if enabled and available
    let propertiesList = "";
    if (state.showProperties && node.properties && node.properties.length > 0) {
      const propertiesToShow = node.properties.slice(0, 3); // Show only first 3 properties
      const propertyItems = propertiesToShow.map((prop) => `<div style="font-size: 11px; color: #8b67ad;">${escapeHtml(prop)}</div>`).join("");

      propertiesList = `<div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);">
        ${propertyItems}
        ${node.properties.length > 3 ? `<div style="font-size: 10px; opacity: 0.7;">${node.properties.length - 3} more...</div>` : ""}
      </div>`;
    }

    return `<div class="node-content">${header}${directoryInfo}${methodsList}${propertiesList}</div>`;
  }

  // Function to add a single node to the graph
  function addNodeToGraph(g, node) {
    try {
      // Filter nodes based on search criteria if defined
      if (state.nodeNameFilter && !node.name.toLowerCase().includes(state.nodeNameFilter)) {
        return;
      }

      if (state.directoryFilter && !node.directory.toLowerCase().includes(state.directoryFilter)) {
        return;
      }

      // Create node label
      const nodeLabel = createNodeLabel(node);

      // Add node to graph
      g.setNode(node.id, {
        label: nodeLabel,
        labelType: "html",
        class: `node-type-${node.type}`,
        rx: 5,
        ry: 5,
        data: node,
      });
    } catch (error) {
      console.error("Error adding node to graph:", error, node);
    }
  }

  // Function to add all nodes to the graph
  function addNodesToGraph(g, nodes) {
    nodes.forEach((node) => {
      addNodeToGraph(g, node);
    });
  }

  // Replace your addEdgeToGraph function with this safer version:
  function addEdgeToGraph(g, edge) {
    try {
      // Check if both source and target nodes exist
      if (!g.hasNode(edge.source) || !g.hasNode(edge.target)) {
        console.warn(`Cannot add edge: ${edge.source} → ${edge.target}. One or both nodes don't exist.`);
        return;
      }

      // Get relationship classes
      const classes = getRelationshipClasses(edge.relationship);

      // Add edge to graph
      g.setEdge(edge.source, edge.target, {
        label: edge.relationship,
        labeloffset: 5,
        curve: d3.curveBasis,
        class: classes.edgeClass,
        labelClass: classes.labelClass,
      });
    } catch (error) {
      console.error("Error adding edge to graph:", error, edge);
    }
  }

  // Function to add all edges to the graph
  function addEdgesToGraph(g, edges) {
    // Filter edges by enabled relationship types
    const filteredEdges = edges.filter((edge) => state.enabledRelationships.includes(edge.relationship));

    filteredEdges.forEach((edge) => {
      addEdgeToGraph(g, edge);
    });
  }

  // Add this function before applyGrouping
  function isGroupExpanded(groupId) {
    const expanded = state.expandedGroups.has(groupId);
    console.log(`Checking if group ${groupId} is expanded: ${expanded}`);
    return expanded;
  }

  // Add this function right after addEdgesToGraph
  function applyGrouping(g, nodes, edges) {
    console.log(`Applying grouping by: ${state.grouping}`);
    console.log(`Groups being tracked in expandedGroups:`, Array.from(state.expandedGroups));

    // Maps to track grouping
    const groups = {};
    const nodeToGroupMap = {};

    // Step 1: Determine groups based on the grouping strategy
    nodes.forEach((node) => {
      let groupKey;
      let groupLabel;

      if (state.grouping === "directory") {
        // Extract directory path components
        const dirParts = node.directory.split("/");

        // For directory grouping, use the first meaningful segment
        for (let i = 0; i < dirParts.length; i++) {
          if (dirParts[i] && dirParts[i] !== "." && dirParts[i] !== "..") {
            groupKey = dirParts[i];
            groupLabel = `Directory: ${groupKey}`;
            break;
          }
        }

        // If no valid directory found, use "Other"
        if (!groupKey) {
          groupKey = "other";
          groupLabel = "Directory: Other";
        }
      } else if (state.grouping === "type") {
        // Group by node type (Model, Service, etc.)
        groupKey = node.type;
        groupLabel = `Type: ${node.type}`;
      } else if (state.grouping === "package") {
        // Try to determine package by examining directory structure
        // This is a simple approximation
        const parts = node.directory.split("/");
        let packageName = "base";

        // Look for typical package indicators in the path
        for (const part of parts) {
          if (["components", "features", "modules", "packages"].includes(part.toLowerCase())) {
            const packageIdx = parts.indexOf(part);
            if (packageIdx >= 0 && packageIdx < parts.length - 1) {
              packageName = parts[packageIdx + 1];
              break;
            }
          }
        }

        groupKey = packageName;
        groupLabel = `Package: ${packageName}`;
      }

      // Create the group if it doesn't exist yet
      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: `group_${groupKey}`,
          key: groupKey,
          label: groupLabel,
          nodes: [],
          type: state.grouping === "type" ? groupKey : "Group",
        };
      }

      // Add node to the group
      groups[groupKey].nodes.push(node);
      nodeToGroupMap[node.id] = groupKey;
    });

    console.log(`Created ${Object.keys(groups).length} groups`);

    // Step 2: Add group nodes to the graph
    Object.values(groups).forEach((group) => {
      // Skip empty groups
      if (group.nodes.length === 0) return;

      // Check if this group is expanded
      const isExpanded = state.expandedGroups.has(group.id);

      // Create group node
      g.setNode(group.id, {
        label: `${group.label} (${group.nodes.length})`,
        clusterLabelPos: "top",
        class: `node group group-type-${group.type}`, // Add 'node' class!
        nodeCount: group.nodes.length,
        isGroup: true,
        isExpanded: isExpanded,
      });

      if (isExpanded) {
        // If group is expanded, add all nodes
        group.nodes.forEach((node) => {
          addNodeToGraph(g, node);
          // Check if the node itself is not a group before setting parent
          if (node.id !== group.id && !node.id.startsWith("group_")) {
            g.setParent(node.id, group.id);
          } else {
            console.warn(`Skipping parent assignment: ${node.id} would create circular reference with ${group.id}`);
          }
        });
      } else {
        // If group is collapsed, add a placeholder node
        const placeholderId = `${group.id}_placeholder`;

        // First add the node
        g.setNode(placeholderId, {
          label: `${group.nodes.length} nodes`,
          class: "node placeholder", // Add node class
          width: 100,
          height: 30,
        });

        // Then set the parent relationship (ensure both nodes exist)
        if (g.hasNode(group.id) && g.hasNode(placeholderId)) {
          g.setParent(placeholderId, group.id);
        } else {
          console.error(`Failed to set parent relationship: group.id=${group.id}, placeholderId=${placeholderId}`);
          // If we can't establish the parent-child relationship, remove the placeholder
          if (g.hasNode(placeholderId)) {
            g.removeNode(placeholderId);
          }
        }
      }
    });

    // Step 3: Add edges based on group expansion state
    edges.forEach((edge) => {
      const sourceGroupKey = nodeToGroupMap[edge.source];
      const targetGroupKey = nodeToGroupMap[edge.target];

      if (!sourceGroupKey || !targetGroupKey) {
        console.warn("Edge references non-existent node:", edge);
        return;
      }

      const sourceGroup = groups[sourceGroupKey];
      const targetGroup = groups[targetGroupKey];
      const sourceGroupId = sourceGroup.id;
      const targetGroupId = targetGroup.id;

      // Case 1: Nodes are in the same group
      if (sourceGroupKey === targetGroupKey) {
        // Only add the edge if the group is expanded
        if (isGroupExpanded(sourceGroupId)) {
          console.log(`Adding edge within expanded group ${sourceGroupId}`);
          addEdgeToGraph(g, edge);
        } else {
          console.log(`Skipping edge in collapsed group ${sourceGroupId}`);
        }
      }
      // Case 2: Nodes are in different groups
      else {
        const sourceExpanded = state.expandedGroups.has(sourceGroupId);
        const targetExpanded = state.expandedGroups.has(targetGroupId);

        console.log(`Group edge: ${sourceGroupId} to ${(targetGroupId, sourceExpanded, targetExpanded)}`);

        if (sourceExpanded && targetExpanded) {
          // Both groups expanded - show edge between actual nodes
          addEdgeToGraph(g, edge);
        } else if (sourceExpanded) {
          // Source expanded, target collapsed - edge from node to group
          // First check if both nodes exist
          if (g.hasNode(edge.source) && g.hasNode(targetGroupId)) {
            g.setEdge(edge.source, targetGroupId, {
              label: edge.relationship,
              labeloffset: 5,
              curve: d3.curveBasis,
              class: getRelationshipClasses(edge.relationship).edgeClass,
              labelClass: getRelationshipClasses(edge.relationship).labelClass,
            });
          }
        } else if (targetExpanded) {
          // Target expanded, source collapsed - edge from group to node
          // First check if both nodes exist
          if (g.hasNode(sourceGroupId) && g.hasNode(edge.target)) {
            g.setEdge(sourceGroupId, edge.target, {
              label: edge.relationship,
              labeloffset: 5,
              curve: d3.curveBasis,
              class: getRelationshipClasses(edge.relationship).edgeClass,
              labelClass: getRelationshipClasses(edge.relationship).labelClass,
            });
          }
        } else {
          // Both collapsed - edge between groups
          // Check if we already have an edge between these groups
          // First check if both nodes exist
          if (g.hasNode(sourceGroupId) && g.hasNode(targetGroupId)) {
            const edgeId = `${sourceGroupId}-${targetGroupId}`;
            if (!g.edge(sourceGroupId, targetGroupId)) {
              g.setEdge(sourceGroupId, targetGroupId, {
                label: "related",
                labeloffset: 5,
                curve: d3.curveBasis,
                class: "group-edge",
                labelClass: "group-edge-label",
              });
            }
          }
        }
      }
    });
  }

  // Function to apply edge label styles
  function applyEdgeLabelStyles() {
    try {
      // Get all edge labels
      const edgeLabels = document.querySelectorAll(".edgeLabel");
      const edges = state.data?.edges || [];

      // For each edge label
      edgeLabels.forEach((label) => {
        // Get the label ID
        const labelId = label.id;
        if (!labelId) return;

        // Get the parts of the ID
        const parts = labelId.split("-");
        if (parts.length < 3) return;

        // Get the edge endpoints
        const edgeParts = parts.slice(1);

        // Find matching edge
        for (const edge of edges) {
          // Check if this edge matches one of our relationships
          if (edgeParts.includes(edge.source) && edgeParts.includes(edge.target)) {
            // Add the appropriate class
            const classes = getRelationshipClasses(edge.relationship);
            label.classList.add(classes.labelClass);
            break;
          }
        }
      });
    } catch (error) {
      console.error("Error applying edge label styles:", error);
    }
  }

  // Function to render the diagram
  function renderDiagram() {
    console.log("Rendering diagram with state:", {
      hasData: !!state.data,
      nodeCount: state.data?.nodes?.length || 0,
      edgeCount: state.data?.edges?.length || 0,
      grouping: state.grouping,
    });

    if (!state.data || !state.data.nodes || state.data.nodes.length === 0) {
      console.log("No data to render");
      nodesCount.textContent = "0 nodes";
      edgesCount.textContent = "0 relationships";
      return;
    }

    try {
      // Clear existing graph
      d3.select("#diagram").selectAll("*").remove();

      // Filter edges by enabled relationship types
      const filteredEdges = state.data.edges.filter((edge) => state.enabledRelationships.includes(edge.relationship));

      // Update statistics
      nodesCount.textContent = `${state.data.nodes.length} nodes`;
      edgesCount.textContent = `${filteredEdges.length} relationships`;

      // Create new graph
      const g = new dagreD3.graphlib.Graph({
        compound: true,
        multigraph: false,
        directed: true,
      })
        .setGraph({
          rankdir: "LR",
          marginx: 50,
          marginy: 50,
          nodesep: 70,
          ranksep: 100,
          edgesep: 40,
          acyclicer: "greedy",
          align: "UL",
        })
        .setDefaultEdgeLabel(() => ({}));

      // Apply grouping if enabled
      if (state.grouping !== "none" && state.data.nodes.length > 0) {
        try {
          // Use simple grouping method for reliability
          applySimpleGrouping(g, state.data.nodes, filteredEdges);
        } catch (groupingError) {
          console.error("Error in grouping:", groupingError);
          // Fall back to non-grouped rendering
          addNodesToGraph(g, state.data.nodes);
          addEdgesToGraph(g, filteredEdges);
        }
      } else {
        // Original rendering logic without grouping
        addNodesToGraph(g, state.data.nodes);
        addEdgesToGraph(g, filteredEdges);
      }

      // Create renderer
      const render = new dagreD3.render();

      // Set up SVG and group - keep svg and svgGroup in the same scope
      let svg, svgGroup;
      try {
        svg = d3.select("#diagram");
        if (svg.empty()) {
          console.error("Could not find #diagram element");
          showError("Diagram element not found");
          return;
        }

        // Create group for graph
        svgGroup = svg.append("g");
      } catch (error) {
        console.error("Error setting up SVG:", error);
        showError("Error setting up diagram: " + error.message);
        return;
      }

      // Set up zoom behavior
      const zoomBehavior = d3
        .zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", (event) => {
          svgGroup.attr("transform", event.transform);
        });

      svg.call(zoomBehavior);

      // Render the graph
      try {
        render(svgGroup, g);
        console.log("Graph rendered successfully");
      } catch (renderError) {
        console.error("Error rendering graph:", renderError);
        showError("Error rendering diagram: " + renderError.message);
        return;
      }

      // Store renderer for later use
      state.renderer = {
        graph: g,
        zoomBehavior: zoomBehavior,
      };

      // Add interactivity to nodes
      try {
        // Add click handlers for nodes
        svg.selectAll("g.node:not(.group)").on("click", function (event, nodeId) {
          const node = g.node(nodeId);
          if (node && node.data && node.data.filePath) {
            vscode.postMessage({
              command: "open-file",
              filePath: node.data.filePath,
            });
          }
        });

        // Add group node interaction
        svg.selectAll("g.node.group").on("click", function (event, nodeId) {
          event.stopPropagation();
          console.log(`Group clicked: ${nodeId}`);

          // Toggle expansion
          if (state.expandedGroups.has(nodeId)) {
            state.expandedGroups.delete(nodeId);
          } else {
            state.expandedGroups.add(nodeId);
          }

          // Add visual feedback
          d3.select(this).classed("clicked", true);
          setTimeout(() => {
            d3.select(this).classed("clicked", false);
          }, 200);

          persistState();
          renderDiagram();
        });

        // Add hover tooltips
        const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

        svg
          .selectAll("g.node")
          .on("mouseover", function (event, nodeId) {
            const nodeData = g.node(nodeId).data;
            if (!nodeData) return;

            let tooltipContent = `<div class="tooltip-header">${nodeData.name || nodeId}</div>`;
            if (nodeData.type) {
              tooltipContent += `<div>${nodeData.type}</div>`;
            }

            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(tooltipContent)
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
          });
      } catch (interactivityError) {
        console.error("Error adding interactivity:", interactivityError);
      }

      // Configure initial zoom to fit content
      const width = diagram.clientWidth;
      const height = diagram.clientHeight;
      const graphWidth = g.graph().width || width;
      const graphHeight = g.graph().height || height;

      const initialScale = Math.min(width / graphWidth, height / graphHeight) * 0.9;
      const initialX = (width - graphWidth * initialScale) / 2;
      const initialY = (height - graphHeight * initialScale) / 2;

      svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));

      console.log("Diagram rendering complete");

      // IMPORTANT: Calculate and update metrics AFTER everything else is done
      // This ensures all graph data is available for metrics calculation
      setTimeout(() => {
        // Slight delay to ensure rendering is complete
        try {
          const diagramMetrics = calculateMetrics(state.data.nodes, filteredEdges);
          updateMetricsPanel(diagramMetrics);
          console.log("Metrics updated successfully");
        } catch (metricsError) {
          console.error("Error updating metrics:", metricsError);
        }
      }, 100);
    } catch (error) {
      console.error("Fatal error in renderDiagram:", error);
      showError("Failed to render diagram: " + error.message);
    }
  }

  // Add this function after addGroupInteractivity
  function focusOnGroup(svg, g, groupId) {
    if (!state.renderer || !state.renderer.zoomBehavior) return;

    // Get the group node
    const groupNode = g.node(groupId);
    if (!groupNode) return;

    // Calculate the zoom parameters
    const width = diagram.clientWidth;
    const height = diagram.clientHeight;

    // Get the group dimensions
    const nodeWidth = groupNode.width || 100;
    const nodeHeight = groupNode.height || 100;

    // Calculate scale - make the group take up about 70% of the view
    const scaleX = (width * 0.7) / nodeWidth;
    const scaleY = (height * 0.7) / nodeHeight;
    const scale = Math.min(scaleX, scaleY, 2); // Limit max zoom level

    // Calculate position
    const translate = [width / 2 - groupNode.x * scale, height / 2 - groupNode.y * scale];

    // Apply zoom with animation
    svg.transition().duration(750).call(state.renderer.zoomBehavior.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
  }

  // Add this function after addNodeInteractivity or replace the existing one
  function addGroupInteractivity(svgGroup, g) {
    // Add click handlers for group nodes
    svgGroup.selectAll("g.node.group:not(.placeholder)").on("click", function (event, groupId) {
      event.stopPropagation();
      console.log("Group clicked:", groupId);
      console.log("Current expanded groups:", Array.from(state.expandedGroups));

      // Toggle group expansion - use a more robust approach
      if (state.expandedGroups.has(groupId)) {
        console.log(`Removing group ${groupId} from expanded set`);
        state.expandedGroups.delete(groupId);
      } else {
        console.log(`Adding group ${groupId} to expanded set`);
        state.expandedGroups.add(groupId);
      }

      console.log("Updated expanded groups:", Array.from(state.expandedGroups));

      // Persist the state change
      persistState();

      // Re-render the diagram with the new expansion state
      renderDiagram();
    });

    // Add hover effect for groups
    svgGroup
      .selectAll("g.node.group")
      .on("mouseover.group", function () {
        d3.select(this).classed("hovered", true);
      })
      .on("mouseout.group", function () {
        d3.select(this).classed("hovered", false);
      });

    // Find where you add click handlers for group nodes after rendering:
    svgGroup.selectAll("g.node.group").on("click", function (event, nodeId) {
      event.stopPropagation();
      console.log(`Group clicked: ${nodeId}`);

      // Toggle expansion
      if (state.expandedGroups.has(nodeId)) {
        state.expandedGroups.delete(nodeId);
      } else {
        state.expandedGroups.add(nodeId);
      }

      // Update styling to indicate clicked state
      d3.select(this).classed("clicked", true);
      setTimeout(() => {
        d3.select(this).classed("clicked", false);
      }, 200);

      persistState();
      renderDiagram();
    });
  }

  // Message handler for communication with the extension
  window.addEventListener("message", (event) => {
    const message = event.data;
    console.log("Received message from extension:", message.command);

    switch (message.command) {
      case "updateDiagram":
        hideError();
        console.log("Received diagram data:", {
          nodeCount: message.data?.nodes?.length || 0,
          edgeCount: message.data?.edges?.length || 0,
        });

        try {
          state.data = message.data;
          persistState();
          renderDiagram();
        } catch (error) {
          console.error("Error updating diagram:", error);
          showError("Error updating diagram: " + error.message);
        }
        updateLoadingState(false);
        break;

      case "updateLoadingStatus":
        updateLoadingState(message.isLoading);
        break;

      case "showError":
        updateLoadingState(false);
        showError(message.error);
        break;

      default:
        console.log("Unknown command:", message.command);
    }
  });

  // Initialize UI and event listeners
  initializeUI();
  setupEventListeners();

  // Call reattachSearchHandlers on initialization to ensure search is working
  reattachSearchHandlers();

  // Initial render if data exists in restored state
  if (state.data) {
    console.log("Rendering with restored state data");
    renderDiagram();
  } else {
    console.log("No data in state, requesting refresh");
    // Request data from extension
    vscode.postMessage({ command: "refresh" });

    // Show loading indicator
    updateLoadingState(true);
  }

  // Add emergency debug render to global scope
  window.debugDiagram = function () {
    console.log("Running emergency debug rendering");

    // Show basic data
    console.log("State:", {
      hasData: !!state.data,
      nodeCount: state.data?.nodes?.length || 0,
      edgeCount: state.data?.edges?.length || 0,
    });

    // Clear existing SVG
    const svg = d3.select("#diagram");
    svg.selectAll("*").remove();

    // Draw a simple representation
    if (!state.data || !state.data.nodes || state.data.nodes.length === 0) {
      svg.append("text").attr("x", 100).attr("y", 100).attr("fill", "white").text("No data available");
      return;
    }

    // Draw simple listing
    svg.append("text").attr("x", 20).attr("y", 30).attr("fill", "white").text(`Found ${state.data.nodes.length} nodes and ${state.data.edges.length} edges`);

    // List a few nodes
    state.data.nodes.slice(0, 10).forEach((node, i) => {
      svg
        .append("text")
        .attr("x", 20)
        .attr("y", 60 + i * 20)
        .attr("fill", "white")
        .text(`${node.name} (${node.type})`);
    });

    return "Debug render complete. Check console for details.";
  };

  // Add this where you have the emergency button
  function showGroupDebugInfo() {
    if (!state.data) {
      console.log("No data to debug");
      return;
    }

    console.log("Showing group debug info");

    // Create an overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "10%";
    overlay.style.left = "10%";
    overlay.style.width = "80%";
    overlay.style.height = "80%";
    overlay.style.background = "rgba(30, 34, 38, 0.95)";
    overlay.style.color = "white";
    overlay.style.padding = "20px";
    overlay.style.zIndex = "10000";
    overlay.style.overflow = "auto";
    overlay.style.borderRadius = "8px";
    overlay.style.boxShadow = "0 0 20px rgba(0,0,0,0.5)";
    document.body.appendChild(overlay);

    // Add close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "10px";
    closeBtn.style.right = "10px";
    closeBtn.style.padding = "5px 10px";
    closeBtn.onclick = function () {
      document.body.removeChild(overlay);
    };
    overlay.appendChild(closeBtn);

    // Add content container to add HTML safely
    const contentDiv = document.createElement("div");
    overlay.appendChild(contentDiv);

    // Group by the current grouping method
    const groupingType = state.grouping;
    const groupMap = {};

    state.data.nodes.forEach((node) => {
      let groupKey = "ungrouped";

      if (groupingType === "directory") {
        const dirParts = node.directory.split("/");
        for (let i = 0; i < dirParts.length; i++) {
          if (dirParts[i] && dirParts[i] !== "." && dirParts[i] !== "..") {
            groupKey = dirParts[i];
            break;
          }
        }
      } else if (groupingType === "type") {
        groupKey = node.type;
      } else if (groupingType === "package") {
        // Simple package detection
        const parts = node.directory.split("/");
        groupKey = parts[0] || "base";
      }

      if (!groupMap[groupKey]) {
        groupMap[groupKey] = [];
      }
      groupMap[groupKey].push(node);
    });

    // Create header
    const header = document.createElement("h2");
    header.textContent = `Grouping by: ${groupingType}`;
    contentDiv.appendChild(header);

    // Create expanded groups list
    const expandedInfo = document.createElement("p");
    expandedInfo.textContent = `Expanded groups: ${Array.from(state.expandedGroups).join(", ") || "none"}`;
    contentDiv.appendChild(expandedInfo);

    // Create table
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    contentDiv.appendChild(table);

    // Create header row
    const headerRow = document.createElement("tr");
    table.appendChild(headerRow);

    const headers = ["Group", "Nodes", "Group ID"];
    headers.forEach((text) => {
      const th = document.createElement("th");
      th.style.textAlign = "left";
      th.style.borderBottom = "1px solid #444";
      th.style.padding = "5px";
      th.textContent = text;
      headerRow.appendChild(th);
    });

    // Create data rows
    Object.entries(groupMap).forEach(([key, nodes]) => {
      const groupId = `group_${key}`;
      const isExpanded = state.expandedGroups.has(groupId);

      const row = document.createElement("tr");
      table.appendChild(row);

      // Group name cell
      const nameCell = document.createElement("td");
      nameCell.style.borderBottom = "1px solid #333";
      nameCell.style.padding = "5px";
      nameCell.textContent = key;
      row.appendChild(nameCell);

      // Node count cell
      const countCell = document.createElement("td");
      countCell.style.borderBottom = "1px solid #333";
      countCell.style.padding = "5px";
      countCell.textContent = nodes.length.toString();
      row.appendChild(countCell);

      // Group ID cell
      const idCell = document.createElement("td");
      idCell.style.borderBottom = "1px solid #333";
      idCell.style.padding = "5px";
      idCell.textContent = `${groupId} ${isExpanded ? "(expanded)" : ""}`;
      row.appendChild(idCell);

      // Add expand button
      const buttonCell = document.createElement("td");
      buttonCell.style.borderBottom = "1px solid #333";
      buttonCell.style.padding = "5px";

      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = isExpanded ? "Collapse" : "Expand";
      toggleBtn.style.padding = "2px 6px";
      toggleBtn.onclick = function () {
        if (isExpanded) {
          state.expandedGroups.delete(groupId);
        } else {
          state.expandedGroups.add(groupId);
        }
        persistState();
        renderDiagram();
        document.body.removeChild(overlay);
      };
      buttonCell.appendChild(toggleBtn);
      row.appendChild(buttonCell);
    });

    // Add direct expansion controls
    const controlsDiv = document.createElement("div");
    controlsDiv.style.marginTop = "20px";
    controlsDiv.style.padding = "10px";
    controlsDiv.style.borderTop = "1px solid #444";
    contentDiv.appendChild(controlsDiv);

    const expandAllBtn = document.createElement("button");
    expandAllBtn.textContent = "Expand All";
    expandAllBtn.style.marginRight = "10px";
    expandAllBtn.style.padding = "5px 10px";
    expandAllBtn.onclick = function () {
      // Add all group IDs to the set
      Object.keys(groupMap).forEach((key) => {
        state.expandedGroups.add(`group_${key}`);
      });
      persistState();
      renderDiagram();
      document.body.removeChild(overlay);
    };
    controlsDiv.appendChild(expandAllBtn);

    const collapseAllBtn = document.createElement("button");
    collapseAllBtn.textContent = "Collapse All";
    collapseAllBtn.style.padding = "5px 10px";
    collapseAllBtn.onclick = function () {
      state.expandedGroups.clear();
      persistState();
      renderDiagram();
      document.body.removeChild(overlay);
    };
    controlsDiv.appendChild(collapseAllBtn);
  }

  // Log initialization complete
  console.log("Diagram initialization complete");

  // Add this utility function
  window.debugExpandedGroups = function () {
    console.log("Current expanded groups:");
    console.log("Type:", typeof state.expandedGroups);
    console.log("Is Set:", state.expandedGroups instanceof Set);
    console.log("Contents:", Array.from(state.expandedGroups));

    console.log("Testing Set operations:");
    const testGroupId = Array.from(state.expandedGroups)[0] || "test_group";
    console.log(`Testing has('${testGroupId}'):`, state.expandedGroups.has(testGroupId));

    console.log("Adding test group:");
    state.expandedGroups.add("test_group");
    console.log("After add:", Array.from(state.expandedGroups));

    console.log("Removing test group:");
    state.expandedGroups.delete("test_group");
    console.log("After delete:", Array.from(state.expandedGroups));

    return "Debug complete. Check console for details.";
  };

  // Add this new function:
  function applySimpleGrouping(g, nodes, edges) {
    console.log(`Applying simple grouping by: ${state.grouping}`);

    // Group the nodes
    const groupMap = {};

    // Step 1: Group nodes but don't use compound graph
    nodes.forEach((node) => {
      let groupKey = "Other";

      if (state.grouping === "directory") {
        const dirParts = node.directory.split("/");
        for (let i = 0; i < dirParts.length; i++) {
          if (dirParts[i] && dirParts[i] !== "." && dirParts[i] !== "..") {
            groupKey = dirParts[i];
            break;
          }
        }
      } else if (state.grouping === "type") {
        groupKey = node.type || "Unknown";
      } else if (state.grouping === "package") {
        const parts = node.directory.split("/");
        groupKey = parts[0] || "base";
      }

      // Track the group
      if (!groupMap[groupKey]) {
        groupMap[groupKey] = {
          key: groupKey,
          nodes: [],
          id: `group_${groupKey.replace(/\s+/g, "_")}`,
        };
      }

      // Add node to group
      groupMap[groupKey].nodes.push(node);
    });

    // Step 2: Add groups and nodes
    let yOffset = 0;
    const xOffsets = {};
    const groupHeight = 40; // Height of group header
    const nodeSpacing = 60; // Vertical space between nodes
    const groupSpacing = 80; // Vertical space between groups

    // First pass: add all groups to establish layout
    Object.values(groupMap).forEach((group) => {
      // Create the group ID in a consistent way
      const groupId = group.id;
      const isExpanded = state.expandedGroups.has(groupId);

      // Add the group header
      g.setNode(groupId, {
        label: `${group.key} • ${group.nodes.length}`, // Using a bullet point separator
        class: `node group group-type-${state.grouping === "type" ? group.key : "Group"}`,
        width: 200,
        height: groupHeight,
        isGroup: true,
        groupKey: group.key,
        nodeCount: group.nodes.length,
      });

      // Calculate vertical position for this group
      yOffset += groupHeight + (isExpanded ? group.nodes.length * nodeSpacing : 0) + groupSpacing;

      // Add the nodes if group is expanded
      if (isExpanded) {
        group.nodes.forEach((node) => {
          addNodeToGraph(g, node);
        });
      }
    });

    // Add edges only between nodes that exist in the graph
    edges.forEach((edge) => {
      if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
        addEdgeToGraph(g, edge);
      }
    });
  }

  // Keep these function definitions for potential future debugging
  window.debugDiagram = function () {
    // Existing function code...
  };

  window.debugExpandedGroups = function () {
    // Existing function code...
  };

  function showGroupDebugInfo() {
    // Existing function code...
  }

  // Add this function to create the metrics panel
  function createMetricsPanel() {
    const panelContainer = document.createElement("div");
    panelContainer.id = "metrics-panel";
    panelContainer.className = "panel";

    // Create toggle button for the panel
    const toggleButton = document.createElement("button");
    toggleButton.className = "panel-toggle";
    toggleButton.innerHTML = '<span class="icon">📊</span> Metrics';
    toggleButton.onclick = function () {
      panelContainer.classList.toggle("expanded");
    };

    // Create panel content
    const panelContent = document.createElement("div");
    panelContent.className = "panel-content";

    // Create sections for different metrics
    const sectionsHTML = `
      <div class="panel-section">
        <h3>Connection Metrics</h3>
        <div id="most-connected-nodes" class="metrics-list"></div>
      </div>
      <div class="panel-section">
        <h3>Dependency Chains</h3>
        <div id="longest-chains" class="metrics-list"></div>
      </div>
      <div class="panel-section">
        <h3>General Statistics</h3>
        <div id="general-stats" class="metrics-list"></div>
      </div>
    `;

    panelContent.innerHTML = sectionsHTML;

    // Assemble the panel
    panelContainer.appendChild(toggleButton);
    panelContainer.appendChild(panelContent);

    // Add to the document
    const appContainer = document.querySelector(".diagram-container") || document.body;
    appContainer.appendChild(panelContainer);

    return panelContainer;
  }

  // Add these functions to calculate and display metrics
  function calculateMetrics(nodes, edges) {
    // Check if inputs are valid
    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      console.error("Invalid inputs to calculateMetrics:", { nodes, edges });
      return null;
    }

    try {
      // Build node connection map
      const nodeConnections = {};
      nodes.forEach((node) => {
        if (!node || !node.id) {
          console.warn("Skipping invalid node in metrics:", node);
          return;
        }

        nodeConnections[node.id] = {
          inbound: 0,
          outbound: 0,
          total: 0,
          node: node,
        };
      });

      // Count connections
      edges.forEach((edge) => {
        if (!edge || !edge.source || !edge.target) {
          console.warn("Skipping invalid edge in metrics:", edge);
          return;
        }

        if (nodeConnections[edge.source]) {
          nodeConnections[edge.source].outbound++;
          nodeConnections[edge.source].total++;
        }
        if (nodeConnections[edge.target]) {
          nodeConnections[edge.target].inbound++;
          nodeConnections[edge.target].total++;
        }
      });

      // Most connected nodes (by total connections)
      const mostConnected = Object.values(nodeConnections)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Most dependent nodes (highest inbound)
      const mostDependedOn = Object.values(nodeConnections)
        .sort((a, b) => b.inbound - a.inbound)
        .slice(0, 5);

      // Most dependent on others (highest outbound)
      const mostDependentOnOthers = Object.values(nodeConnections)
        .sort((a, b) => b.outbound - a.outbound)
        .slice(0, 5);

      // Find longest dependency chains
      const longestChains = findLongestDependencyChains(nodes, edges);

      // Calculate general statistics
      const generalStats = {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        avgConnectionsPerNode: edges.length / nodes.length,
        mostCommonNodeType: findMostCommonNodeType(nodes),
        mostCommonRelationship: findMostCommonRelationship(edges),
      };

      return {
        mostConnected,
        mostDependedOn,
        mostDependentOnOthers,
        longestChains,
        generalStats,
        nodeConnections,
      };
    } catch (error) {
      console.error("Error calculating metrics:", error);
      return null;
    }
  }

  // Helper function to find longest dependency chains
  function findLongestDependencyChains(nodes, edges) {
    // Create adjacency list
    const graph = {};
    nodes.forEach((node) => {
      graph[node.id] = [];
    });

    edges.forEach((edge) => {
      if (graph[edge.source]) {
        graph[edge.source].push(edge.target);
      }
    });

    // Find longest paths using DFS
    const visited = {};
    const pathLengths = {};
    const longestPaths = {};
    let maxLength = 0;

    function dfs(nodeId, path) {
      visited[nodeId] = true;
      path.push(nodeId);

      // If we haven't seen this node or found a longer path to it
      const currentLength = path.length;
      if (!pathLengths[nodeId] || currentLength > pathLengths[nodeId]) {
        pathLengths[nodeId] = currentLength;
        longestPaths[nodeId] = [...path];

        if (currentLength > maxLength) {
          maxLength = currentLength;
        }
      }

      // Visit neighbors
      for (const neighbor of graph[nodeId] || []) {
        if (!visited[neighbor]) {
          dfs(neighbor, path);
        }
      }

      path.pop();
      visited[nodeId] = false;
    }

    // Run DFS from each node
    nodes.forEach((node) => {
      dfs(node.id, []);
    });

    // Get the top 3 longest chains
    const longestChains = [];
    Object.entries(longestPaths).forEach(([nodeId, path]) => {
      if (path.length >= maxLength - 2) {
        // Get paths close to max length
        longestChains.push({
          startNode: nodeId,
          length: path.length,
          path: path,
        });
      }
    });

    return longestChains.sort((a, b) => b.length - a.length).slice(0, 3);
  }

  // Helper function to find most common node type
  function findMostCommonNodeType(nodes) {
    const typeCounts = {};
    nodes.forEach((node) => {
      if (!typeCounts[node.type]) typeCounts[node.type] = 0;
      typeCounts[node.type]++;
    });

    let maxCount = 0;
    let mostCommonType = "Unknown";

    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = type;
      }
    });

    return {
      type: mostCommonType,
      count: maxCount,
      percentage: Math.round((maxCount / nodes.length) * 100),
    };
  }

  // Helper function to find most common relationship
  function findMostCommonRelationship(edges) {
    const relationshipCounts = {};
    edges.forEach((edge) => {
      if (!relationshipCounts[edge.relationship]) {
        relationshipCounts[edge.relationship] = 0;
      }
      relationshipCounts[edge.relationship]++;
    });

    let maxCount = 0;
    let mostCommonRelationship = "Unknown";

    Object.entries(relationshipCounts).forEach(([relationship, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonRelationship = relationship;
      }
    });

    return {
      relationship: mostCommonRelationship,
      count: maxCount,
      percentage: Math.round((maxCount / edges.length) * 100),
    };
  }

  // Add a function to check if the metrics panel exists and create it if needed:
  function ensureMetricsPanelExists() {
    if (!document.getElementById("metrics-panel")) {
      createMetricsPanel();
    }
  }

  // Update the updateMetricsPanel function to be more robust:
  function updateMetricsPanel(metrics) {
    // Make sure the panel exists
    ensureMetricsPanelExists();

    if (!metrics) {
      console.warn("No metrics available to update panel");

      // Update panel with placeholder content
      const sections = ["most-connected-nodes", "longest-chains", "general-stats"];
      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.innerHTML = '<div class="metric-item">No data available</div>';
        }
      });

      return;
    }

    // Update most connected nodes section
    const mostConnectedNodes = document.getElementById("most-connected-nodes");
    mostConnectedNodes.innerHTML = metrics.mostConnected
      .map(
        (item) => `
      <div class="metric-item">
        <span class="metric-name highlight-node" data-node-id="${item.node.id}">${item.node.name}</span>
        <span class="metric-value">${item.total} connections
          <span class="metric-badge">↑${item.outbound}</span>
          <span class="metric-badge">↓${item.inbound}</span>
        </span>
      </div>
    `
      )
      .join("");

    // Update longest chains section
    const longestChains = document.getElementById("longest-chains");
    longestChains.innerHTML = metrics.longestChains
      .map((chain) => {
        const startNode = chain.path[0];
        const endNode = chain.path[chain.path.length - 1];

        return `
        <div class="metric-item">
          <span class="metric-name">
            <span class="highlight-node" data-node-id="${startNode}">${startNode}</span> → 
            <span class="highlight-node" data-node-id="${endNode}">${endNode}</span>
          </span>
          <span class="metric-value">${chain.length} nodes</span>
        </div>
      `;
      })
      .join("");

    // Update general stats section
    const generalStats = document.getElementById("general-stats");
    generalStats.innerHTML = `
      <div class="metric-item">
        <span class="metric-name">Average Connections</span>
        <span class="metric-value">${metrics.generalStats.avgConnectionsPerNode.toFixed(1)}</span>
      </div>
      <div class="metric-item">
        <span class="metric-name">Most Common Type</span>
        <span class="metric-value">${metrics.generalStats.mostCommonNodeType.type} 
          <span class="metric-badge">${metrics.generalStats.mostCommonNodeType.percentage}%</span>
        </span>
      </div>
      <div class="metric-item">
        <span class="metric-name">Most Common Relationship</span>
        <span class="metric-value">${metrics.generalStats.mostCommonRelationship.relationship}
          <span class="metric-badge">${metrics.generalStats.mostCommonRelationship.percentage}%</span>
        </span>
      </div>
    `;

    // Add click handlers to node highlights
    document.querySelectorAll(".highlight-node").forEach((element) => {
      element.addEventListener("click", function () {
        const nodeId = this.getAttribute("data-node-id");
        highlightNode(nodeId);
      });
    });
  }

  // Function to highlight a specific node in the diagram
  function highlightNode(nodeId) {
    // Clear any previous highlights
    d3.selectAll("g.node rect").classed("highlighted", false);

    // Highlight the selected node
    d3.select(`g.node[id='${nodeId}'] rect`).classed("highlighted", true);

    // If we have the renderer, try to center on the node
    if (state.renderer && state.renderer.graph && state.renderer.graph.node(nodeId)) {
      const nodeData = state.renderer.graph.node(nodeId);
      const svg = d3.select("#diagram");
      const width = diagram.clientWidth;
      const height = diagram.clientHeight;

      // Calculate transform to center on the node
      const scale = 1.5;
      const x = width / 2 - nodeData.x * scale;
      const y = height / 2 - nodeData.y * scale;

      // Apply the transform
      svg.transition().duration(750).call(state.renderer.zoomBehavior.transform, d3.zoomIdentity.translate(x, y).scale(scale));
    }
  }

  // Add this function to your diagram.js file or your relationship diagram provider class:

  function reattachSearchHandlers() {
    // Get the search input elements
    const directorySearch = document.getElementById("directory-search");
    const fileSearch = document.getElementById("file-search");

    if (directorySearch) {
      // Clear existing listeners to avoid duplicates
      const newDirectorySearch = directorySearch.cloneNode(true);
      directorySearch.parentNode.replaceChild(newDirectorySearch, directorySearch);

      // Add event listener for directory search
      newDirectorySearch.addEventListener("input", (event) => {
        state.directoryFilter = event.target.value.toLowerCase();
        renderDiagram();
      });
    }

    if (fileSearch) {
      // Clear existing listeners to avoid duplicates
      const newFileSearch = fileSearch.cloneNode(true);
      fileSearch.parentNode.replaceChild(newFileSearch, fileSearch);

      // Add event listener for file search
      newFileSearch.addEventListener("input", (event) => {
        state.nodeNameFilter = event.target.value.toLowerCase();
        renderDiagram();
      });
    }

    const searchButton = document.getElementById("search-button");
    if (searchButton) {
      const newSearchButton = searchButton.cloneNode(true);
      searchButton.parentNode.replaceChild(newSearchButton, searchButton);
      newSearchButton.addEventListener("click", performSearch);
    }

    console.log("Search handlers reattached");
  }
})();
