import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import CytoscapeComponent from "react-cytoscapejs";
import {
  AppShell,
  Container,
  FileInput,
  NumberInput,
  Select,
  Button,
  Group,
  Title,
  Paper,
  Table,
  Text,
  Tabs,
  Grid,
  Col,
  ScrollArea,
  Accordion,
  Menu 
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { NavbarMinimalColored } from '../Navbar/NavbarMinimalColored';
import * as XLSX from "xlsx";

interface QDData {
  quantity: Record<string, number>;
  diversity: Record<string, number>;
}

interface DyadicAnalysisData {
  significant_edges: [string, string, number][];
  pruned_edges: [string, string, number][];
}

interface ClusterLabelsData {
  [node: string]: string;
}

const LAYOUT_OPTIONS = [
  { value: "spring", label: "Spring" },
  { value: "bipartite", label: "Bipartite" },
  { value: "circular", label: "Circular" },
];

const PRUNING_OPTIONS = [
  { value: "none", label: "No Pruning" },
  { value: "custom", label: "Custom Pruning" },
];

const DEG_OPTIONS = [
    { value: "Set 1", label: "Set 1" },
    { value: "Set 2", label: "Set 2" },
    { value: "none", label: "None" },
];

export function Webinterface() {
  const [opened, { toggle }] = useDisclosure();
  const [uploadedData, setUploadedData] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [elements, setElements] = useState<any[]>([]);
  const [group, setGroup] = useState<string>("All");
  const [groups, setGroups] = useState<string[]>([]);
  const [attr1, setAttr1] = useState<string>("");
  const [attr2, setAttr2] = useState<string>("");
  const [weight, setWeight] = useState<string>("equal_weight");
  const [pruning, setPruning] = useState<string>("none");
  const [alpha, setAlpha] = useState<number>(0.05);
  const [fixDeg, setFixDeg] = useState<string>("Set 1");
  const [layout, setLayout] = useState<string>("bipartite");
  const [zoom, setZoom] = useState<number>(1);
  const [qdData, setQdData] = useState<QDData | null>(null);
  const [dyadicAnalysis, setDyadicAnalysis] = useState<DyadicAnalysisData | null>(null);
  const [clusterLabels, setClusterLabels] = useState<ClusterLabelsData | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("node-level");
  const cyRef = useRef<any>(null);

  // Handle file upload using Mantine's FileInput component
  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const groupOptions: string[] = ["All", ...res.data.groups.filter((g: string) => g !== "All")];
      setGroups(groupOptions);
      setColumns(res.data.columns);
      setUploadedData(res.data.data);
    } catch (error) {
      console.error("Error during file upload:", error);
    }
  };

  const handleSave = (full: boolean) => {
    if (!cyRef.current) return;
    const dataUrl = cyRef.current.png({ full, bg: 'white' });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `graph_${full ? "full" : "partial"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateHinaNetwork = async () => {
    if (!uploadedData) return;
    const params = new URLSearchParams();
    params.append("data", uploadedData);
    params.append("group", group);
    params.append("attribute1", attr1);
    params.append("attribute2", attr2);
    params.append("weight", weight);
    params.append("pruning", pruning);
    params.append("alpha", alpha.toString());
    params.append("fix_deg", fixDeg);
    params.append("layout", layout);
    try {
      const res = await axios.post("http://localhost:8000/build-hina-network", params);
      setElements(res.data.elements);
      if (res.data.dyadic_analysis) {
        setDyadicAnalysis(res.data.dyadic_analysis);
      } else {
        setDyadicAnalysis(null);
      }
      fetchQuantityAndDiversity();
    } catch (error) {
      console.error("Error updating HINA network:", error);
    }
  };

  // Update Clustered network endpoint
  const updateClusteredNetwork = async () => {
    if (!uploadedData) return;
    const params = new URLSearchParams();
    params.append("data", uploadedData);
    params.append("group", group);
    params.append("attribute1", attr1);
    params.append("attribute2", attr2);
    params.append("weight", weight);
    params.append("pruning", pruning);
    params.append("alpha", alpha.toString());
    params.append("fix_deg", fixDeg);
    params.append("layout", layout);
    try {
      const res = await axios.post("http://localhost:8000/build-cluster-network", params);
      setElements(res.data.elements);
      if (res.data.cluster_labels) {
        setClusterLabels(res.data.cluster_labels);
      } else {
        setClusterLabels(null);
      }
      fetchQuantityAndDiversity();
    } catch (error) {
      console.error("Error updating Clustered network:", error);
    }
  };

  // Fetch Quantity & Diversity data endpoint
  const fetchQuantityAndDiversity = async () => {
    if (!uploadedData) return;
    const params = new URLSearchParams();
    params.append("data", uploadedData);
    params.append("attribute1", attr1);
    params.append("attribute2", attr2);
    try {
      const res = await axios.post("http://localhost:8000/quantity-diversity", params);
      setQdData(res.data);
    } catch (error) {
      console.error("Error computing Quantity & Diversity:", error);
    }
  };

  // Zoom functions
  const zoomIn = () => setZoom((prevZoom) => Math.min(prevZoom * 1.2, 3));
  const zoomOut = () => setZoom((prevZoom) => Math.max(prevZoom / 1.2, 0.3));

  // Export to XLSX
  const exportToXLSX = () => {
    const wb = XLSX.utils.book_new();

    if (activeTab === "node-level") {
      if (!qdData) return;
      const nodeLevelData = [
        ["Attribute", "Quantity", "Diversity"],
        ...Object.keys(qdData.quantity).map((key) => [
          key,
          qdData.quantity[key],
          qdData.diversity[key],
        ]),
      ];
      const wsNode = XLSX.utils.aoa_to_sheet(nodeLevelData);
      XLSX.utils.book_append_sheet(wb, wsNode, "Quantity & Diversity");
      XLSX.writeFile(wb, "quantity_and_diversity.xlsx");
    } else if (activeTab === "dyadic") {
      if (!dyadicAnalysis) return;
      const sigData = [
        ["Node 1", "Node 2", "Weight"],
        ...dyadicAnalysis.significant_edges.map((edge) => [edge[0], edge[1], edge[2]]),
      ];
      const wsSig = XLSX.utils.aoa_to_sheet(sigData);
      XLSX.utils.book_append_sheet(wb, wsSig, "Significant Edges");

      const prunedData = [
        ["Node 1", "Node 2", "Weight"],
        ...dyadicAnalysis.pruned_edges.map((edge) => [edge[0], edge[1], edge[2]]),
      ];
      const wsPruned = XLSX.utils.aoa_to_sheet(prunedData);
      XLSX.utils.book_append_sheet(wb, wsPruned, "Pruned Edges");

      XLSX.writeFile(wb, "dyadic_analysis.xlsx");
    } else if (activeTab === "cluster") {
      if (!clusterLabels) return;
      const clusterData = [
        ["Node", "Cluster Label"],
        ...Object.keys(clusterLabels).map((node) => [
          node,
          clusterLabels[node],
        ]),
      ];
      const wsCluster = XLSX.utils.aoa_to_sheet(clusterData);
      XLSX.utils.book_append_sheet(wb, wsCluster, "Cluster Labels");
      XLSX.writeFile(wb, "mesoscale_clustering.xlsx");
    }
  };

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const handleTap = (evt: any) => {
      // Remove highlight class from all nodes
      cy.nodes().removeClass("highlight");
      // Add highlight to the clicked node
      evt.target.addClass("highlight");
    };
    cy.on("tap", "node", handleTap);
    return () => {
      cy.removeListener("tap", "node", handleTap);
    };
  }, [elements]);

  return (
    <AppShell
      padding="md"
      // navbar={{ width: 180, breakpoint: "md", collapsed: { mobile: !opened } }} 
    >
      {/* <AppShell.Navbar p="sm">
        <NavbarMinimalColored />  
      </AppShell.Navbar> */}

      <AppShell.Main>
        <Container fluid style={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* File Upload and Attribute Set Section */}
          <Paper withBorder shadow="sm" p="md" mb="md" style={{ width: "100%" }}>
            <FileInput
              label="Upload CSV File"
              placeholder="Select CSV file"
              onChange={handleFileUpload}
              mb="md"
            />
            {columns.length > 0 && (
              <Paper withBorder shadow="sm" p="md" mb="md">
                <Group grow>
                  <Select
                    label="Group"
                    value={group}
                    onChange={(value) => setGroup(value || "All")}
                    data={["All", ...groups.filter((g) => g !== "All")]}
                  />
                  <Select
                    label="Attribute 1"
                    value={attr1}
                    onChange={(value) => setAttr1(value || "")}
                    data={columns}
                  />
                  <Select
                    label="Attribute 2"
                    value={attr2}
                    onChange={(value) => setAttr2(value || "")}
                    data={columns}
                  />
                  <Select
                    label="Weight Column"
                    value={weight}
                    onChange={(value) => setWeight(value || "equal_weight")}
                    data={[
                      { value: "equal_weight", label: "Equal Weight" },
                      ...columns,
                    ]}
                  />
                </Group>
                <Group mt="md">
                    <Select
                        label="Pruning"
                        value={pruning}
                        onChange={(value) => setPruning(value || "none")}
                        data={PRUNING_OPTIONS}
                    />
                    {pruning === "custom" && (
                    <>
                        <NumberInput
                        value={alpha}
                        onChange={(value) => setAlpha(value as number || 0.05)}
                        label="Alpha"
                        style={{ width: "100px" }}
                        placeholder="Alpha"
                        step={0.01}
                        />
                        <Select
                        label="Fix Deg"
                        value={fixDeg}
                        onChange={(value) => setFixDeg(value || "Set 1")}
                        data={DEG_OPTIONS}
                        />
                    </>
                    )}
                    <Select
                        label="Layout"
                        value={layout}
                        onChange={(value) => setLayout(value || "spring")}
                        data={LAYOUT_OPTIONS}
                    />
                </Group>
                <Group mt="md">
                  <Button onClick={updateHinaNetwork}>Update HINA Network</Button>
                  <Button onClick={updateClusteredNetwork}>Update Clustered Network</Button>
                </Group>
              </Paper>   
            )}
            <Grid>

              <Grid.Col span={8}>
                {/* Left Panel for Network Visualization */}
                <Paper
                  withBorder
                  shadow="sm"
                  style={{ flex: 1, position: "relative", height: "700px", marginBottom: "20px" }}
                >
                  <CytoscapeComponent
                    elements={elements}
                    style={{ width: "100%", height: "100%" }}
                    layout={{ name: "preset" }}
                    zoom={zoom}
                    userZoomingEnabled={false}
                    userPanningEnabled={true}
                    stylesheet={[
                      {
                        selector: "node",
                        style: {
                          "background-color": "data(color)",
                          "label": "data(id)",
                          "text-valign": "center",
                          "color": "#fff",
                          "text-outline-width": 2,
                          "text-outline-color": "data(color)"
                        },
                      },
                      {
                        selector: "node.highlight",
                        style: {
                          "background-color": "red"
                        },
                      },
                      {
                        selector: "edge",
                        style: {
                          "line-color": "#ccc",
                          "width": "data(weight)",
                          "label": "data(label)",
                          "font-size": "10px",
                          "text-rotation": "autorotate",
                          "text-margin-y": -10,
                        },
                      },
                    ]}
                    cy={(cy) => {
                      cyRef.current = cy;
                    }}
                  />

                  <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10 }}>
                    <Menu shadow="md" width={100} trigger="click-hover" openDelay={100} closeDelay={400}>
                      <Menu.Target>
                        <Button>Save</Button>
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
                    <Button onClick={zoomIn} style={{ fontSize: "24px", margin: "2px" }}>
                      +
                    </Button>
                    <Button onClick={zoomOut} style={{ fontSize: "24px", margin: "2px" }}>
                      –
                    </Button>
                  </div>
                </Paper>
              </Grid.Col>

              <Grid.Col span={4}>
                {/* Right Panel for Analytical Results */}
                <ScrollArea h={700}>
                  <Paper withBorder shadow="sm" style={{ flex: 1, height: "1200px"}}>
                    <Tabs value={activeTab} onChange={setActiveTab}>
                      <Tabs.List>
                        <Tabs.Tab value="node-level">Node-Level</Tabs.Tab>
                        <Tabs.Tab value="dyadic">Dyadic Analysis</Tabs.Tab>
                        <Tabs.Tab value="cluster">Mesoscale Clustering</Tabs.Tab>
                      </Tabs.List>

                      {/* Node-Level Tab Content */}
                      <Tabs.Panel value="node-level">
                        {qdData && (
                          <Paper withBorder shadow="sm" p="md">
                            <Title order={3}>Quantity & Diversity Data for {attr1}</Title>
                            <Table highlightOnHover withTableBorder withColumnBorders>
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th style={{ textAlign: "center" }}>{attr1 || "Attribute 1"}</Table.Th>
                                  <Table.Th style={{ textAlign: "center" }}>Quantity</Table.Th>
                                  <Table.Th style={{ textAlign: "center" }}>Diversity</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {Object.keys(qdData.quantity || {}).map((key) => (
                                  <Table.Tr key={key}>
                                    <Table.Td style={{ textAlign: "center" }}>{key}</Table.Td>
                                    <Table.Td style={{ textAlign: "center" }}>{qdData.quantity[key]}</Table.Td>
                                    <Table.Td style={{ textAlign: "center" }}>{qdData.diversity[key]}</Table.Td>
                                  </Table.Tr>
                                ))}
                              </Table.Tbody>
                            </Table>
                          </Paper>
                        )}
                      </Tabs.Panel>

                      {/* Dyadic Analysis Tab Content */}
                      <Tabs.Panel value="dyadic">
                        {dyadicAnalysis ? (
                          <Accordion transitionDuration={500}>
                            <Accordion.Item value="sig">
                              <Accordion.Control>
                                <Title order={4}>
                                  Significant Edges ({dyadicAnalysis.significant_edges.length})
                                </Title>
                              </Accordion.Control>
                              <Accordion.Panel>
                                <Table highlightOnHover withTableBorder withColumnBorders>
                                  <Table.Thead>
                                    <Table.Tr>
                                      <Table.Th style={{ textAlign: "center" }}>Node 1</Table.Th>
                                      <Table.Th style={{ textAlign: "center" }}>Node 2</Table.Th>
                                      <Table.Th style={{ textAlign: "center" }}>Weight</Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {dyadicAnalysis.significant_edges.map((edge, idx) => (
                                      <Table.Tr key={idx}>
                                        <Table.Td style={{ textAlign: "center" }}>{edge[0]}</Table.Td>
                                        <Table.Td style={{ textAlign: "center" }}>{edge[1]}</Table.Td>
                                        <Table.Td style={{ textAlign: "center" }}>{edge[2]}</Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </Accordion.Panel>
                            </Accordion.Item>

                            <Accordion.Item value="pruned">
                              <Accordion.Control>
                                <Title order={4}>
                                  Pruned Edges ({dyadicAnalysis.pruned_edges.length})
                                </Title>
                              </Accordion.Control>
                              <Accordion.Panel>
                                <Table highlightOnHover withTableBorder withColumnBorders>
                                  <Table.Thead>
                                    <Table.Tr>
                                      <Table.Th style={{ textAlign: "center" }}>Node 1</Table.Th>
                                      <Table.Th style={{ textAlign: "center" }}>Node 2</Table.Th>
                                      <Table.Th style={{ textAlign: "center" }}>Weight</Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {dyadicAnalysis.pruned_edges.map((edge, idx) => (
                                      <Table.Tr key={idx}>
                                        <Table.Td style={{ textAlign: "center" }}>{edge[0]}</Table.Td>
                                        <Table.Td style={{ textAlign: "center" }}>{edge[1]}</Table.Td>
                                        <Table.Td style={{ textAlign: "center" }}>{edge[2]}</Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </Accordion.Panel>
                            </Accordion.Item>
                          </Accordion>
                        ) : (
                          <Text>No Dyadic analysis data available.</Text>
                        )}
                      </Tabs.Panel>

                      {/* Mesoscale Clustering Tab Content */}
                      <Tabs.Panel value="cluster">
                        {clusterLabels ? (
                          <Paper withBorder shadow="sm" p="md">
                            <Title order={3}>Cluster Labels</Title>
                            <Table highlightOnHover withTableBorder withColumnBorders>
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th style={{ textAlign: "center" }}>Node</Table.Th>
                                  <Table.Th style={{ textAlign: "center" }}>Cluster Label</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {Object.keys(clusterLabels).map((node) => (
                                  <Table.Tr key={node}>
                                    <Table.Td style={{ textAlign: "center" }}>{node}</Table.Td>
                                    <Table.Td style={{ textAlign: "center" }}>{clusterLabels[node]}</Table.Td>
                                  </Table.Tr>
                                ))}
                              </Table.Tbody>
                            </Table>
                          </Paper>
                        ) : (
                          <Text>No Mesoscale clustering data available.</Text>
                        )}
                      </Tabs.Panel>
                    </Tabs>

                    {/* Export Button */}
                    {qdData && (
                      <Group mt="md">
                        <Button onClick={exportToXLSX}>Export Results</Button>
                      </Group>
                    )}
                  </Paper>
                </ScrollArea>
              </Grid.Col>
            </Grid>
          </Paper>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
