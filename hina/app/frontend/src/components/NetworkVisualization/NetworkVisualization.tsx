import React, { useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import { Paper, ActionIcon, Switch, Select, Menu, Button } from "@mantine/core";
import { IconZoomIn, IconZoomOut, IconDownload } from "@tabler/icons-react";

interface NetworkVisualizationProps {
  elements: any[];
  currentNetworkView: 'hina' | 'cluster' | 'object' | null;
  groups: string[];
  group: string;
  handleGroupChange: (value: string | null) => void;
  clusterLabels: Record<string, string> | null;
  cluster: string;
  clusterOptions: string[];
  handleClusterChange: (value: string | null) => void;
  communityOptions: string[];
  selectedCommunityId: string;
  handleCommunityChange: (value: string) => void;
  showLabels: boolean;
  showEdgeWeights: boolean;
  setShowLabels: (value: boolean) => void;
  setShowEdgeWeights: (value: boolean) => void;
  handleSave: (full: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  setZoom: (value: number) => void;
  cyRef: React.RefObject<any>;
  highlightedNodeId: string | null;
}

export const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  elements,
  currentNetworkView,
  groups,
  group,
  handleGroupChange,
  clusterLabels,
  cluster,
  clusterOptions,
  handleClusterChange,
  communityOptions,
  selectedCommunityId,
  handleCommunityChange,
  showLabels,
  showEdgeWeights,
  setShowLabels,
  setShowEdgeWeights,
  handleSave,
  zoomIn,
  zoomOut,
  resetView,
  setZoom,
  cyRef,
  highlightedNodeId,
}) => {
  const [initialRenderDone, setInitialRenderDone] = useState(false);

  // NetworkFilters component for the appropriate filter based on current view
  const NetworkFilters = () => {
    if (!elements.length) return null;
    
    const filterPaperStyle = {
      background: 'transparent',
      width: '50%',
      border: 'none',
      boxShadow: 'none',
      padding: 0
    };
    
    switch (currentNetworkView) {
      case 'hina':
        return groups.length > 1 ? (
          <Paper style={filterPaperStyle}>
            <Select
              radius="xl"
              checkIconPosition="right"
              maxDropdownHeight={200}
              comboboxProps={{ width: 150, position: 'bottom-start', transitionProps: { transition: 'pop', duration: 200 }}}
              label="Group Filter"
              value={group}
              onChange={handleGroupChange}
              data={groups}
            />
          </Paper>
        ) : null;
      case 'cluster':
        return clusterLabels ? (
          <Paper style={filterPaperStyle}>
            <Select
              radius="xl"
              checkIconPosition="right"
              maxDropdownHeight={200}
              comboboxProps={{ width: 150, position: 'bottom-start', transitionProps: { transition: 'pop', duration: 200 }}}
              label="Cluster Filter"
              value={cluster}
              onChange={handleClusterChange}
              data={clusterOptions}
            />
          </Paper>
        ) : null;
      case 'object':
        return communityOptions.length > 0 ? (
          <Paper style={filterPaperStyle}>
            <Select
              radius="xl"
              checkIconPosition="right"
              maxDropdownHeight={200}
              comboboxProps={{ width: 150, position: 'bottom-start', transitionProps: { transition: 'pop', duration: 200 }}}
              label="Community Filter"
              value={selectedCommunityId}
              onChange={handleCommunityChange}
              data={communityOptions.map(id => ({ value: id, label: `Community ${id}` }))}
            />
          </Paper>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Paper
      withBorder
      shadow="sm"
      style={{ flex: 1, position: "relative", height: "700px", marginBottom: "20px" }}
    >
      <div style={{ position: "absolute", top: "5px", left: "10px", zIndex: 999 }}>
        <NetworkFilters />
      </div>
      
      <CytoscapeComponent
        elements={elements}
        style={{ width: "100%", height: "100%" }}
        layout={{ name: "preset" }}
        userZoomingEnabled={false}
        userPanningEnabled={true}
        stylesheet={[
          {
            selector: "node",
            style: {
              "background-color": "data(color)",
              "border-width": 1,
              "border-color": "#000000",
              "height": 20,
              "width": 20,
              "label": showLabels && (highlightedNodeId === null || `data(id)` === highlightedNodeId) ? "data(id)" : "",
              "text-valign": "center",
              "color": "#fff",
              "text-outline-width": 2,
              "text-outline-color": "data(color)"
            },
          },
          {
            selector: "node.highlight",
            style: {
              "background-color": "data(color)",
              "border-width": 8,
              "border-color": "#a593f5",
              "border-opacity": 0.8,
              "label": "data(id)", // Always show label for highlighted nodes
              "height": 30,
              "width": 30,
              // Removed shadow properties that were causing errors
            },
          },
          {
            selector: "edge",
            style: {
              "line-color": "#ccc",
              "target-arrow-color": "#ccc",
              "curve-style": "bezier",
              "width": "data(weight)",
              "label": showEdgeWeights ? "data(label)" : "",
              "font-size": "10px",
              "text-rotation": "autorotate",
              "text-margin-y": 0,
              "text-halign": "center",
              "text-valign": "center",
              "color": "#000",
              "text-background-color": "#fff",
              "text-background-opacity": 1,
              "text-background-padding": "2px",
            },
          },
          {
            selector: "edge.highlight",
            style: {
              "line-color": "#FF5733",
              "width": "data(weight)",
              "target-arrow-color": "#FF5733",
              "opacity": 1
            }
          }
        ]}
        cy={(cy) => {
          cyRef.current = cy;
          if (!initialRenderDone && elements.length > 0) {
            setTimeout(() => {
              cy.fit();
              const defaultZoom = cy.zoom() * 0.9;
              cy.zoom(defaultZoom);
              setZoom(cy.zoom());
              cy.center();
              setInitialRenderDone(true); 
            }, 10);
          }
        }}
      />
    
      {elements.length > 0 && (
        <div style={{ 
          position: "absolute", 
          top: "10px", 
          right: "100px", 
          zIndex: 10,
          display: "flex",
          flexDirection: "row",
          gap: "10px",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0)", 
          padding: "5px 10px",
        }}>
          <Switch
            checked={showLabels}
            onChange={(event) => setShowLabels(event.currentTarget.checked)}
            label="Labels"
            size="sm"
            styles={{ label: { fontWeight: 'bold' } }}
          />
          <Switch
            checked={showEdgeWeights}
            onChange={(event) => setShowEdgeWeights(event.currentTarget.checked)}
            label="Weights"
            size="sm"
            styles={{ label: { fontWeight: 'bold' } }}
          />
        </div>
      )}

      {elements.length > 0 && (
        <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10 }}>
          <Menu shadow="md" width={100} trigger="click-hover" openDelay={100} closeDelay={400}>
            <Menu.Target>
                <Button
                    rightSection={<IconDownload size={14} />}
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'cyan', deg: 90 }} 
                >
                    Save
                </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => handleSave(true)}>
                Save Full
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item onClick={() => handleSave(false)}>
                Save Now
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      )}

      {elements.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ActionIcon
            variant="gradient"
            gradient={{ from: 'indigo', to: 'cyan', deg: 90 }}  
            onClick={resetView} 
            size="xl"
            radius="lg"  
            mb="xs"                    
          >
            Reset
          </ActionIcon>
          <ActionIcon
            variant="gradient"
            gradient={{ from: 'indigo', to: 'cyan', deg: 90 }}  
            onClick={zoomIn} 
            size="xl"  
            radius="lg"
            mb="xs"                    
          >
            <IconZoomIn />
          </ActionIcon>
          <ActionIcon
            variant="gradient"
            gradient={{ from: 'indigo', to: 'cyan', deg: 90 }}  
            onClick={zoomOut} 
            size="xl"  
            radius="lg"                   
          >
            <IconZoomOut />
          </ActionIcon>
        </div>
      )}
    </Paper>
  );
};