// Diagram renderer for ExpressWebJs object relationships

(function () {
  // VS Code API for posting messages to the extension
  const vscode = acquireVsCodeApi();

  // State management
  const state = {
    data: null,
    zoomLevel: 1,
    showMethods: true,
    showProperties: true,
    enabledRelationships: ["extends", "implements", "depends on", "imports", "instantiates"],
    renderer: null,
  };

  // Keep latest state in VS Code storage
  function persistState() {
    vscode.setState(state);
  }

  // Initialize from previous state if available
  const previousState = vscode.getState();
  if (previousState) {
    Object.assign(state, previousState);
  }

  // DOM elements
  const diagram = document.getElementById("diagram");
  const loadingOverlay = document.getElementById("loading-overlay");
  const errorMessage = document.getElementById("error-message");
  const directorySearch = document.getElementById("directory-search");
  const fileSearch = document.getElementById("file-search");
  const searchButton = document.getElementById("search-button");
  const resetSearchButton = document.getElementById("reset-search");
  const exportSvgButton = document.getElementById("export-svg");
  const exportPngButton = document.getElementById("export-png");
  const refreshButton = document.getElementById("refresh");
  const zoomInButton = document.getElementById("zoom-in");
  const zoomOutButton = document.getElementById("zoom-out");
  const zoomFitButton = document.getElementById("zoom-fit");
  const nodesCount = document.getElementById("nodes-count");
  const edgesCount = document.getElementById("edges-count");
  const toggleMethodsCheckbox = document.getElementById("toggle-methods");
  const togglePropertiesCheckbox = document.getElementById("toggle-properties");
  const relationshipCheckboxes = document.querySelectorAll('input[name="relationship-type"]');
  const includeRelatedNodesCheckbox = document.getElementById("include-related");

  // Event listeners
  searchButton.addEventListener("click", performSearch);
  resetSearchButton.addEventListener("click", resetSearch);
  exportSvgButton.addEventListener("click", exportAsSvg);
  exportPngButton.addEventListener("click", exportAsPng);
  refreshButton.addEventListener("click", refreshDiagram);
  zoomInButton.addEventListener("click", () => zoom(1.2));
  zoomOutButton.addEventListener("click", () => zoom(0.8));
  zoomFitButton.addEventListener("click", resetZoom);
  toggleMethodsCheckbox.addEventListener("change", () => {
    state.showMethods = toggleMethodsCheckbox.checked;
    renderDiagram();
  });
  togglePropertiesCheckbox.addEventListener("change", () => {
    state.showProperties = togglePropertiesCheckbox.checked;
    renderDiagram();
  });
  relationshipCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      // Update the enabled relationships list
      state.enabledRelationships = Array.from(relationshipCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);
      renderDiagram();
    });
  });

  // Search functionality
  function performSearch() {
    const directory = directorySearch.value.trim();
    const fileName = fileSearch.value.trim();
    const includeRelatedNodes = includeRelatedNodesCheckbox.checked;

    // Show loading indicator
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

  function resetSearch() {
    directorySearch.value = "";
    fileSearch.value = "";

    vscode.postMessage({
      command: "search",
      criteria: {
        includeAll: true,
      },
    });
  }

  // Handle refresh
  function refreshDiagram() {
    vscode.postMessage({
      command: "refresh",
    });
  }

  // Export functions
  function exportAsSvg() {
    if (!state.data || state.data.nodes.length === 0) return;

    // Get SVG content
    const svgEl = diagram.cloneNode(true);

    // Add required attributes for standalone SVG
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgEl.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    // Add CSS styles inline
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .node rect {
        fill: #1e2226;
        stroke: #2c3033;
        stroke-width: 1px;
      }
      .node text {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro', Roboto, Oxygen, sans-serif;
        fill: #e6e6e6;
        font-weight: 500;
      }
      .edgePath path {
        stroke: #c5c5c5;
        stroke-width: 1px;
        fill: none;
      }
      .edgePath marker {
        fill: #c5c5c5;
      }
      .node .method-list {
        fill: #c5c5c5;
        font-size: 11px;
      }
      .model-fill { fill: #477DC0; }
      .repository-fill { fill: #D09144; }
      .service-fill { fill: #7EB36A; }
      .controller-fill { fill: #C64F4D; }
      .middleware-fill { fill: #8B67AD; }
      .other-fill { fill: #7099A6; }
    `;
    svgEl.prepend(styleElement);

    // Send SVG data to extension for saving
    vscode.postMessage({
      command: "export",
      format: "svg",
      data: svgEl.outerHTML,
    });
  }

  function exportAsPng() {
    if (!state.data || state.data.nodes.length === 0) return;

    // Create a canvas element
    const canvas = document.createElement("canvas");
    const svgElement = diagram;
    const box = svgElement.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;

    // Set canvas dimensions
    canvas.width = box.width * scale;
    canvas.height = box.height * scale;

    const context = canvas.getContext("2d");
    context.scale(scale, scale);

    // Convert SVG to image data
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      // Fill with dark background
      context.fillStyle = "#121416";
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the SVG image
      context.drawImage(image, 0, 0, box.width, box.height);
      URL.revokeObjectURL(url);

      // Get PNG data and send to extension
      vscode.postMessage({
        command: "export",
        format: "png",
        data: canvas.toDataURL("image/png"),
      });
    };
    image.src = url;
  }

  // Zoom controls
  function zoom(factor) {
    if (!state.renderer) return;

    const currentTransform = state.renderer.zoomBehavior.transform;
    const newScale = currentTransform.k * factor;

    // Limit scale to reasonable range
    if (newScale > 0.1 && newScale < 10) {
      state.renderer.zoomBehavior.scaleBy(d3.select(diagram), factor);
      state.zoomLevel = newScale;
      persistState();
    }
  }

  function resetZoom() {
    if (!state.renderer) return;

    const width = diagram.clientWidth;
    const height = diagram.clientHeight;

    state.renderer.zoomBehavior.transform(d3.select(diagram), d3.zoomIdentity.translate(width / 2, height / 2).scale(1));

    state.zoomLevel = 1;
    persistState();
  }

  // Loading and error state management
  function updateLoadingState(isLoading) {
    if (isLoading) {
      loadingOverlay.classList.remove("hidden");
    } else {
      loadingOverlay.classList.add("hidden");
    }
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
  }

  function hideError() {
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");
  }

  // Main diagram rendering
  function renderDiagram() {
    if (!state.data || !state.data.nodes || state.data.nodes.length === 0) {
      nodesCount.textContent = "0 nodes";
      edgesCount.textContent = "0 relationships";
      return;
    }

    // Clear existing graph
    d3.select("#diagram").selectAll("*").remove();

    // Filter edges by enabled relationship types
    const filteredEdges = state.data.edges.filter((edge) => state.enabledRelationships.includes(edge.relationship));

    // Update statistics
    nodesCount.textContent = `${state.data.nodes.length} nodes`;
    edgesCount.textContent = `${filteredEdges.length} relationships`;

    // Create new graph
    const g = new dagreD3.graphlib.Graph({ compound: true })
      .setGraph({
        rankdir: "LR",
        marginx: 50,
        marginy: 50,
        nodesep: 70,
        ranksep: 100,
        edgesep: 40,
      })
      .setDefaultEdgeLabel(() => ({}));

    // Add nodes
    state.data.nodes.forEach((node) => {
      // Get node style properties based on type
      const nodeStyle = getNodeStyle(node.type);

      // Create HTML-like label content
      const labelContent = createNodeLabel(node);

      g.setNode(node.id, {
        labelType: "html",
        label: labelContent,
        rx: 5,
        ry: 5,
        padding: 10,
        class: `${node.type.toLowerCase()}-node`,
        style: `fill: ${nodeStyle.fill}; opacity: 0.9; cursor: pointer;`,
        data: node,
      });
    });

    // Add filtered edges
    filteredEdges.forEach((edge) => {
      // Get classes for this relationship type
      const classes = getRelationshipClasses(edge.relationship);

      g.setEdge(edge.source, edge.target, {
        label: edge.relationship,
        labeloffset: 5,
        curve: d3.curveBasis,
        class: classes.edgeClass,
        labelClass: classes.labelClass,
      });
    });

    // Create renderer
    const render = new dagreD3.render();

    // Set up SVG and group
    const svg = d3.select("#diagram");
    const svgGroup = svg.append("g");

    // Set up zoom behavior
    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        svgGroup.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    // Render the graph
    render(svgGroup, g);

    // Store renderer for later use
    state.renderer = {
      graph: g,
      zoomBehavior: zoomBehavior,
    };

    // Configure initial zoom to fit content
    const width = diagram.clientWidth;
    const height = diagram.clientHeight;
    const graphWidth = g.graph().width;
    const graphHeight = g.graph().height;

    const initialScale = Math.min(width / graphWidth, height / graphHeight) * 0.9;
    const initialX = (width - graphWidth * initialScale) / 2;
    const initialY = (height - graphHeight * initialScale) / 2;

    svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));

    // Add click handlers for nodes
    svg.selectAll("g.node").on("click", function (event, nodeId) {
      const node = g.node(nodeId);
      if (node && node.data && node.data.filePath) {
        vscode.postMessage({
          command: "open-file",
          filePath: node.data.filePath,
        });
      }
    });

    // Later in the rendering code, after the render() call, add class to the marker
    // This goes after your render(svgGroup, g) call
    svgGroup.selectAll(".edgePath").each(function (d) {
      const edge = g.edge(d);
      if (edge && edge.class) {
        // Add the same class to the arrowhead marker
        d3.select(this).select("marker").attr("class", edge.class);
      }
    });

    // After calling render(svgGroup, g)
    // Add this code to apply specific styling to edges
    svgGroup.selectAll("g.edgePath").each(function (d) {
      const edge = g.edge(d);
      if (edge && edge.class) {
        // Apply class to the path
        d3.select(this).select("path").classed(edge.class, true);

        // Apply class to the marker
        const marker = d3.select(this).select("marker");
        if (marker) {
          marker.select("path").style("fill", getRelationshipColor(edge.class));
        }

        // Apply class to labels
        const edgeLabel = svgGroup.select(`.edgeLabel[id$="${d.v}-${d.w}"]`);
        if (edgeLabel && edge.labelClass) {
          edgeLabel.classed(edge.labelClass, true);
        }
      }
    });

    const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

    // Add hover effects to nodes
    svg
      .selectAll("g.node")
      .on("mouseover", function (event, nodeId) {
        const node = g.node(nodeId).data;

        // If this is a search result, show what matched
        let tooltipContent = `<div class="tooltip-header">${node.name}</div>`;

        if (node.searchMatches) {
          tooltipContent += `<div class="tooltip-matches">
            Matches: ${node.searchMatches.join(", ")}
          </div>`;
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

    applyEdgeLabelStyles();
  }

  function createNodeLabel(node) {
    // Create header with node name and type
    const header = `<div style="font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px; margin-bottom: 5px;">
      ${escapeHtml(node.name)}
    </div>`;

    // Create directory info
    const directoryInfo = `<div style="font-size: 11px; opacity: 0.8; margin-bottom: 5px;">
      ${escapeHtml(node.directory)}
    </div>`;

    // Create methods list if enabled and available
    let methods = "";
    if (state.showMethods && node.methods && node.methods.length) {
      methods = `<div style="font-size: 12px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);">`;

      // Limit to 5 methods to avoid enormous nodes
      const displayMethods = node.methods.slice(0, 5);
      const remaining = Math.max(0, node.methods.length - 5);

      displayMethods.forEach((method) => {
        methods += `<div style="margin: 2px 0;">${escapeHtml(method)}()</div>`;
      });

      if (remaining > 0) {
        methods += `<div style="margin-top: 4px; font-style: italic; opacity: 0.7;">+${remaining} more...</div>`;
      }

      methods += `</div>`;
    }

    // Create properties list if enabled and available
    let properties = "";
    if (state.showProperties && node.properties && node.properties.length) {
      properties = `<div style="font-size: 12px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.1);">`;

      // Limit to 5 properties to avoid enormous nodes
      const displayProperties = node.properties.slice(0, 5);
      const remaining = Math.max(0, node.properties.length - 5);

      displayProperties.forEach((prop) => {
        properties += `<div style="margin: 2px 0;">${escapeHtml(prop)}</div>`;
      });

      if (remaining > 0) {
        properties += `<div style="margin-top: 4px; font-style: italic; opacity: 0.7;">+${remaining} more...</div>`;
      }

      properties += `</div>`;
    }

    return `<div class="node-content">${header}${directoryInfo}${methods}${properties}</div>`;
  }

  function getNodeStyle(nodeType) {
    switch (nodeType) {
      case "Model":
        return { fill: "#477DC0" };
      case "Repository":
        return { fill: "#D09144" };
      case "Service":
        return { fill: "#7EB36A" };
      case "Controller":
        return { fill: "#C64F4D" };
      case "Middleware":
        return { fill: "#8B67AD" };
      default:
        return { fill: "#7099A6" };
    }
  }

  // Add this function to get relationship-specific classes
  function getRelationshipClasses(relationship) {
    const normalizedRelationship = relationship.toLowerCase().replace(/\s+/g, "-");

    return {
      edgeClass: `${normalizedRelationship}-path`,
      labelClass: `${normalizedRelationship}-label`,
    };
  }

  // Helper function to escape HTML
  function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // Add function to get color from relationship class
  function getRelationshipColor(className) {
    if (className.includes("extends")) return "var(--extends-color)";
    if (className.includes("implements")) return "var(--implements-color)";
    if (className.includes("depends-on")) return "var(--depends-on-color)";
    if (className.includes("imports")) return "var(--imports-color)";
    if (className.includes("instantiates")) return "var(--instantiates-color)";
    return "#c5c5c5"; // Default color
  }

  // Add this function for highlighting search matches in the diagram
  function highlightSearchMatches(searchTerm) {
    if (!searchTerm || !state.data) return;

    const term = searchTerm.toLowerCase();

    // Highlight nodes that match search
    d3.selectAll(".node")
      .classed("search-match", function (d) {
        const node = state.data.nodes.find((n) => n.id === d);
        if (!node) return false;

        // Check if node name matches
        if (node.name.toLowerCase().includes(term)) return true;

        // Check if directory matches
        if (node.directory.toLowerCase().includes(term)) return true;

        // Check methods
        if (node.methods && node.methods.some((m) => m.toLowerCase().includes(term))) return true;

        // Check properties
        if (node.properties && node.properties.some((p) => p.toLowerCase().includes(term))) return true;

        return false;
      })
      .classed("search-related", function (d) {
        if (d3.select(this).classed("search-match")) return false;

        // Check if this node is related to a search match
        const edges = state.data.edges;
        const matchNodes = d3.selectAll(".node.search-match").data();

        return edges.some((edge) => (edge.source === d && matchNodes.includes(edge.target)) || (edge.target === d && matchNodes.includes(edge.source)));
      });
  }

  // Add this function to apply edge label styles
  function applyEdgeLabelStyles() {
    // Get all edge labels
    const edgeLabels = document.querySelectorAll(".edgeLabel");

    // For each edge label
    edgeLabels.forEach((label) => {
      // Get the edge ID from the label ID (e.g., 'edgelabel-Model-User-Service-Auth')
      const labelId = label.id;
      if (!labelId) return;

      // Get the source and target node IDs from the label ID
      const parts = labelId.split("-");
      if (parts.length < 3) return;

      // Reconstruct the edge key
      const sourceIdx = parts.indexOf("edgelabel") + 1;
      const sourceId = parts.slice(sourceIdx).join("-");

      // Find the matching edge
      const matchingEdge = edges.find((e) => e.source === sourceId || e.target === sourceId);

      if (matchingEdge) {
        // Add the appropriate class
        const classes = getRelationshipClasses(matchingEdge.relationship);
        label.classList.add(classes.labelClass);
      }
    });
  }

  // Handle messages from the extension
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.command) {
      case "updateDiagram":
        hideError();
        state.data = message.data;
        persistState();
        renderDiagram();
        break;

      case "updateLoadingStatus":
        updateLoadingState(message.isLoading);
        break;

      case "showError":
        updateLoadingState(false);
        showError(message.error);
        break;
    }
  });

  // Initial render if data exists in restored state
  if (state.data) {
    renderDiagram();
  }
})();
