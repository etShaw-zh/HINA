import React from "react";
import CytoscapeComponent from "react-cytoscapejs";
import { Paper, ActionIcon, Switch, Select, Menu, Button, Slider, Text, Group, LoadingOverlay } from "@mantine/core";
import { IconZoomIn, IconZoomOut, IconDownload } from "@tabler/icons-react";

interface NetworkVisualizationProps {
    elements: any[];
    currentNetworkView: 'hina' | 'cluster' | 'object' | null;
    groups: string[];
    group: string;
    groupCol?: string;
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
    
    // Node size props
    studentNodeSize: number;
    objectNodeSize: number;
    object1NodeSize: number;
    object2NodeSize: number;
    isObjectOnlyMode: boolean;
    setStudentNodeSize: (value: number) => void;
    setObjectNodeSize: (value: number) => void;
    setObject1NodeSize: (value: number) => void;
    setObject2NodeSize: (value: number) => void;
}

export const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
    elements,
    currentNetworkView,
    groups,
    group,
    groupCol = "none",
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
    studentNodeSize,
    objectNodeSize,
    object1NodeSize,
    object2NodeSize,
    isObjectOnlyMode,
    setStudentNodeSize,
    setObjectNodeSize,
    setObject1NodeSize,
    setObject2NodeSize
}) => {
    const [initialRenderDone, setInitialRenderDone] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    React.useEffect(() => {
        if (elements.length > 0) {
            setLoading(true);
        }
    }, [elements]);

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
                return groupCol !== "none" && groups.length > 1 ? (
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

            <div style={{ position: "relative", height: "100%" }}>
                <LoadingOverlay 
                    visible={loading} 
                    overlayProps={{ radius: 'sm', blur: 2 }}
                    loaderProps={{ size: 'xl', color: 'indigo', type: 'bars' }}
                    zIndex={100}
                />
                <CytoscapeComponent
                    elements={elements}
                    style={{ width: "100%", height: "100%" }}
                    layout={{ name: "preset" }}
                    userZoomingEnabled={false}
                    userPanningEnabled={true}
                    stylesheet={[
                        {
                            // Student nodes
                            selector: "node[type='student'], node.student",
                            style: {
                                "background-color": "data(color)",
                                "border-width": 1,
                                "border-color": "#000000",
                                "height": studentNodeSize,
                                "width": studentNodeSize,
                                "label": showLabels && (highlightedNodeId === null || `data(id)` === highlightedNodeId) ? "data(id)" : "",
                                "text-valign": "center",
                                "color": "#fff",
                                "text-outline-width": 2,
                                "text-outline-color": "data(color)"
                            },
                        },
                        {
                            // Object1 nodes in object-only mode
                            selector: "node[type='object1'], node.object1",
                            style: {
                                "background-color": "data(color)",
                                "border-width": 1,
                                "border-color": "#000000",
                                "height": isObjectOnlyMode ? object1NodeSize : objectNodeSize,
                                "width": isObjectOnlyMode ? object1NodeSize : objectNodeSize,
                                "label": showLabels && (highlightedNodeId === null || `data(id)` === highlightedNodeId) ? "data(id)" : "",
                                "text-valign": "center",
                                "color": "#fff",
                                "text-outline-width": 2,
                                "text-outline-color": "data(color)"
                            },
                        },
                        {
                            // Object2 nodes in object-only mode
                            selector: "node[type='object2'], node.object2",
                            style: {
                                "background-color": "data(color)",
                                "border-width": 1,
                                "border-color": "#000000",
                                "height": isObjectOnlyMode ? object2NodeSize : objectNodeSize,
                                "width": isObjectOnlyMode ? object2NodeSize : objectNodeSize,
                                "label": showLabels && (highlightedNodeId === null || `data(id)` === highlightedNodeId) ? "data(id)" : "",
                                "text-valign": "center",
                                "color": "#fff",
                                "text-outline-width": 2,
                                "text-outline-color": "data(color)"
                            },
                        },
                        {
                            // Combined object nodes
                            selector: "node[type='object1_object2'], node.object1_object2",
                            style: {
                                "background-color": "data(color)",
                                "border-width": 1,
                                "border-color": "#000000",
                                "height": objectNodeSize,
                                "width": objectNodeSize,
                                "label": showLabels && (highlightedNodeId === null || `data(id)` === highlightedNodeId) ? "data(id)" : "",
                                "text-valign": "center",
                                "color": "#fff",
                                "text-outline-width": 2,
                                "text-outline-color": "data(color)"
                            },
                        },
                        {
                            // Unknown nodes
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
                                "height": (ele) => {
                                    if (isObjectOnlyMode) {
                                        if (ele.hasClass('object1') || ele.data('type') === 'object1') {
                                            return Math.max(30, object1NodeSize * 1.5);
                                        } else if (ele.hasClass('object2') || ele.data('type') === 'object2') {
                                            return Math.max(30, object2NodeSize * 1.5);
                                        }
                                    } else {
                                        if (ele.hasClass('student') || ele.data('type') === 'student') {
                                            return Math.max(30, studentNodeSize * 1.5);
                                        } else if (
                                            ele.hasClass('object1') || 
                                            ele.hasClass('object2') || 
                                            ele.hasClass('object1_object2') ||
                                            ele.data('type') === 'object1' ||
                                            ele.data('type') === 'object2' ||
                                            ele.data('type') === 'object1_object2'
                                        ) {
                                            return Math.max(30, objectNodeSize * 1.5);
                                        }
                                    }
                                    return 30;
                                },
                                "width": (ele) => {
                                    // Apply different sizing logic based on mode
                                    if (isObjectOnlyMode) {
                                        if (ele.hasClass('object1') || ele.data('type') === 'object1') {
                                            return Math.max(30, object1NodeSize * 1.5);
                                        } else if (ele.hasClass('object2') || ele.data('type') === 'object2') {
                                            return Math.max(30, object2NodeSize * 1.5);
                                        }
                                    } else {
                                        if (ele.hasClass('student') || ele.data('type') === 'student') {
                                            return Math.max(30, studentNodeSize * 1.5);
                                        } else if (
                                            ele.hasClass('object1') || 
                                            ele.hasClass('object2') || 
                                            ele.hasClass('object1_object2') ||
                                            ele.data('type') === 'object1' ||
                                            ele.data('type') === 'object2' ||
                                            ele.data('type') === 'object1_object2'
                                        ) {
                                            return Math.max(30, objectNodeSize * 1.5);
                                        }
                                    }
                                    return 30;
                                },
                            },
                        },
                        {
                            selector: "edge",
                            style: {
                                "line-color": "#ccc",
                                "target-arrow-color": "#ccc",
                                "curve-style": "bezier",
                                "width": (ele) => {
                                    const weight = ele.data('weight');
                                    return Math.min(1 + Math.sqrt(weight), 8);
                                },              
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
                                "width": (ele) => {
                                    const weight = ele.data('weight');
                                    return Math.min(1 + Math.sqrt(weight), 8);
                                },   
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
                                setLoading(false); 
                            }, 100);
                        } else {
                            setLoading(false);
                        }
                    }}
                />
            </div>
        
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
                        disabled={highlightedNodeId !== null}
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
                <>
                    {/* Node size control panel */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: "10px",
                            left: "10px",
                            zIndex: 999,
                            width: '180px'
                        }}
                    >
                        <Paper 
                            p="xs" 
                            style={{ 
                                background: 'transparent', 
                                border: 'none',
                                borderRadius: '8px',
                                width: '100%',
                                boxShadow: 'none',
                                padding: 0
                            }}
                        >                            
                            {isObjectOnlyMode ? (
                                // Object-only mode sliders (object1 and object2)
                                <>
                                    <Group spacing="xs" align="center" mb="xl">
                                        <Text size="xs">Node Size Controls</Text>
                                        <Slider
                                            size="xs"
                                            min={10}
                                            max={50}
                                            value={object1NodeSize}
                                            onChange={(value) => {
                                                setObject1NodeSize(value);
                                            }}
                                            style={{ width: '100%' }}
                                            thumbSize={14}
                                            step={2}
                                            label={null}
                                            color="indigo"
                                        />
                                    </Group>
                                    
                                    <Group spacing="xs" align="center">
                                        <Slider
                                            size="xs"
                                            min={10}
                                            max={50}
                                            value={object2NodeSize}
                                            onChange={(value) => {
                                                setObject2NodeSize(value);
                                            }}
                                            style={{ width: '100%' }}
                                            thumbSize={14}
                                            step={2}
                                            label={null}
                                            color="green"
                                        />
                                    </Group>
                                </>
                            ) : (
                                // Standard mode sliders (student and object)
                                <>
                                    <Group spacing="xs" align="center" mb="xl">
                                        <Text size="xs">Node Size Controls</Text>
                                        <Slider
                                            size="xs"
                                            min={10}
                                            max={50}
                                            value={studentNodeSize}
                                            onChange={(value) => {
                                                setStudentNodeSize(value);
                                            }}
                                            style={{ width: '100%' }}
                                            thumbSize={14}
                                            step={2}
                                            label={null}
                                            color="grey"
                                        />
                                    </Group>
                                    
                                    <Group spacing="xs" align="center">
                                        <Slider
                                            size="xs"
                                            min={10}
                                            max={50}
                                            value={objectNodeSize}
                                            onChange={(value) => {
                                                setObjectNodeSize(value);
                                            }}
                                            style={{ width: '100%' }}
                                            thumbSize={14}
                                            step={2}
                                            label={null}
                                            color="green"
                                        />
                                    </Group>
                                </>
                            )}
                        </Paper>
                    </div>

                    {/* Action buttons */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: "10px",
                            right: "10px",
                            zIndex: 999,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
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
                </>
            )}
        </Paper>
    );
};