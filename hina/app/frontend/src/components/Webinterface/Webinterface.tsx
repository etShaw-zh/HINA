import React, { useState, useRef, useEffect, useMemo } from "react";
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
import { IconArrowsSort, IconSortAscending, IconSortDescending, IconDownload, IconRefresh, IconZoomIn, IconZoomOut } from "@tabler/icons-react";

// For local development
axios.defaults.baseURL = 'http://localhost:8000';

export function Webinterface() {
  const [opened, { toggle }] = useDisclosure();
  const [uploadedData, setUploadedData] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [elements, setElements] = useState<any[]>([]);
  const [groupCol, setGroupCol] = useState<string>("none");
  const [group, setGroup] = useState<string>("All");
  const [groups, setGroups] = useState<string[]>([]);
  const [student, setStudent] = useState<string>("");
  const [object1, setObject1] = useState<string>("");
  const [object2, setObject2] = useState<string>("");
  const [attr, setAttr] = useState<string>("none");
  const [numberCluster, setNumberCluster] = useState<string>("");
  const [cluster, setCluster] = useState<string>("");
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
  interface QDData {
  quantity: Record<string, number>;
  diversity: Record<string, number>;
}

  interface DyadicAnalysisData {
    significant_edges: [string, string, number][];
    // pruned_edges: [string, string, number][];
  }

  interface ClusterLabelsData {
    [node: string]: string;
  }

  type SortConfig = { key: string; direction: "asc" | "desc" } | null;

  const [qdSortConfig, setQdSortConfig] = useState<SortConfig>(null);
  const [dyadicSigSortConfig, setDyadicSigSortConfig] = useState<SortConfig>(null);
  // const [dyadicPrunedSortConfig, setDyadicPrunedSortConfig] = useState<SortConfig>(null);
  const [clusterSortConfig, setClusterSortConfig] = useState<SortConfig>(null);

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

  // Handle file upload using Mantine's FileInput component
  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("/upload", formData, {
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
    params.append("group_col", groupCol); 
    params.append("group", group);
    params.append("student_col", student);  
    params.append("object1_col", object1);  
    params.append("attr_col", attr); 
    params.append("pruning", pruning);
    params.append("alpha", alpha.toString());
    params.append("fix_deg", fixDeg);
    params.append("layout", layout);  

    try {
      console.log("Sending build-hina-network request with params:", {
        group, student_col: student, object1_col: object1, 
        group_col: groupCol, attr_col: attr, pruning
      });
      const res = await axios.post("/build-hina-network", params);
      console.log("Received response:", res.data);
      setElements(res.data.elements);
      if (res.data.significant_edges) {
        setDyadicAnalysis(res.data.significant_edges);
      } else {
        setDyadicAnalysis(null);
      }
      // fetchQuantityAndDiversity();
    } catch (error) {
      console.error("Error updating HINA network:", error);
      console.error("Error details:", error.response?.data || error.message)
    }
  };

  // Update Clustered network endpoint
  const updateClusteredNetwork = async () => {
    if (!uploadedData) return;
    const params = new URLSearchParams();
    params.append("data", uploadedData);
    params.append("group", group);
    params.append("student_col", student);  
    params.append("object1_col", object1);  
    params.append("number_cluster", numberCluster);
    params.append("pruning", pruning);
    params.append("alpha", alpha.toString());
    params.append("fix_deg", fixDeg);
    params.append("layout", layout);
    console.log("number_cluster", numberCluster)
    try {
      const res = await axios.post("/build-cluster-network", params);
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
    params.append("student_col", student);  
    params.append("object1_col", object1);
    try {
      const res = await axios.post("/quantity-diversity", params);
      setQdData(res.data);
    } catch (error) {
      console.error("Error computing Quantity & Diversity:", error);
    }
  };

  // Zoom functions
  const zoomIn = () => setZoom((prevZoom) => Math.min(prevZoom * 1.2, 3));
  const zoomOut = () => setZoom((prevZoom) => Math.max(prevZoom / 1.2, 0.1));

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
        ...dyadicAnalysis.map((edge) => [edge[0], edge[1], edge[2]]),
      ];
      const wsSig = XLSX.utils.aoa_to_sheet(sigData);
      XLSX.utils.book_append_sheet(wb, wsSig, "Significant Edges");

      // const prunedData = [
      //   ["Node 1", "Node 2", "Weight"],
      //   ...dyadicAnalysis.pruned_edges.map((edge) => [edge[0], edge[1], edge[2]]),
      // ];
      // const wsPruned = XLSX.utils.aoa_to_sheet(prunedData);
      // XLSX.utils.book_append_sheet(wb, wsPruned, "Pruned Edges");

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

  // Compute sorted data for Node-Level table
  const qdTableData = useMemo(() => {
    if (!qdData) return [];
    const data = Object.keys(qdData.quantity).map((key) => ({
      Attribute: key,
      Quantity: qdData.quantity[key],
      Diversity: qdData.diversity[key],
    }));
    if (qdSortConfig !== null) {
      data.sort((a, b) => {
        if (a[qdSortConfig.key] < b[qdSortConfig.key]) {
          return qdSortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[qdSortConfig.key] > b[qdSortConfig.key]) {
          return qdSortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return data;
  }, [qdData, qdSortConfig]);

  // Compute sorted data for Dyadic Analysis Significant Edges table
  const dyadicSigTableData = useMemo(() => {
    if (!dyadicAnalysis) return [];
    console.log("dyadicAnalysis", Array.isArray(dyadicAnalysis) )
    const data = dyadicAnalysis.map((edge) => ({
      "Node 1": edge[0],
      "Node 2": edge[1],
      Weight: edge[2],
    }));
    if (dyadicSigSortConfig !== null) {
      data.sort((a, b) => {
        if (a[dyadicSigSortConfig.key] < b[dyadicSigSortConfig.key]) {
          return dyadicSigSortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[dyadicSigSortConfig.key] > b[dyadicSigSortConfig.key]) {
          return dyadicSigSortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return data;
  }, [dyadicAnalysis, dyadicSigSortConfig]);

  // Compute sorted data for Dyadic Analysis Pruned Edges table
  // const dyadicPrunedTableData = useMemo(() => {
  //   if (!dyadicAnalysis) return [];
  //   const data = dyadicAnalysis.pruned_edges.map((edge) => ({
  //     "Node 1": edge[0],
  //     "Node 2": edge[1],
  //     Weight: edge[2],
  //   }));
  //   if (dyadicPrunedSortConfig !== null) {
  //     data.sort((a, b) => {
  //       if (a[dyadicPrunedSortConfig.key] < b[dyadicPrunedSortConfig.key]) {
  //         return dyadicPrunedSortConfig.direction === "asc" ? -1 : 1;
  //       }
  //       if (a[dyadicPrunedSortConfig.key] > b[dyadicPrunedSortConfig.key]) {
  //         return dyadicPrunedSortConfig.direction === "asc" ? 1 : -1;
  //       }
  //       return 0;
  //     });
  //   }
  //   return data;
  // }, [dyadicAnalysis, dyadicPrunedSortConfig]);

  // Compute sorted data for Cluster Labels table
  const clusterTableData = useMemo(() => {
    if (!clusterLabels) return [];
    const data = Object.keys(clusterLabels).map((node) => ({
      Node: node,
      "Cluster Label": clusterLabels[node],
    }));
    if (clusterSortConfig !== null) {
      data.sort((a, b) => {
        if (a[clusterSortConfig.key] < b[clusterSortConfig.key]) {
          return clusterSortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[clusterSortConfig.key] > b[clusterSortConfig.key]) {
          return clusterSortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return data;
  }, [clusterLabels, clusterSortConfig]);

  // Determine if the current active tab has exportable data
  const hasExportData = useMemo(() => {
    if (activeTab === "node-level") {
      return !!qdData;
    } else if (activeTab === "dyadic") {
      return !!dyadicAnalysis;
    } else if (activeTab === "cluster") {
      return !!clusterLabels;
    }
    return false;
  }, [activeTab, qdData, dyadicAnalysis, clusterLabels]);

  // Helper function to toggle sort for a given key and config state setter
  const toggleSort = (
    key: string,
    sortConfig: SortConfig,
    setSortConfig: React.Dispatch<React.SetStateAction<SortConfig>>
  ) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
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
              label="Upload File"
              placeholder="Select CSV/XLSX file"
              accept=".csv,.xlsx"
              onChange={handleFileUpload}
              mb="md"
            />
            {columns.length > 0 && (
              <Paper withBorder shadow="sm" p="md" mb="md">
                <Group grow>
                  <Select
                    label="Student Column"
                    value={student}
                    onChange={(value) => setStudent(value || "")}
                    data={columns}
                  />
                  <Select
                    label="Object 1 Column"
                    value={object1}
                    onChange={(value) => setObject1(value || "")}
                    data={columns}
                  />
                  <Select
                    label="Object 2 Column (Only for Tripartite Analysis)"
                    withAsterisk
                    value={object2}
                    onChange={(value) => setObject2(value || "")}
                    data={columns}
                  />
                </Group>
                <Group grow mt="md" mb="md">
                  <Select
                    label="Object Attribute (Optional)"
                    withAsterisk
                    value={attr}
                    onChange={(value) => setAttr(value || "none")}
                    data={columns}
                  />
                  <Select
                    label="Group Column (Optional)"
                    withAsterisk
                    value={groupCol}
                    onChange={(value) => setGroupCol(value || "none")}
                    data={columns}
                  />
                  <Select
                    label="Group"
                    value={group}
                    onChange={(value) => setGroup(value || "All")}
                    data={["All", ...groups.filter((g) => g !== "All")]}
                  />
                  <Select
                    label="Cluster"
                    value={cluster}
                    onChange={(value) => setCluster(value || "All")}
                    data={["All", ...groups.filter((g) => g !== "All")]}
                  />                
                </Group>
                <Group grow mt="md" mb="md">
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
                    <NumberInput
                      label="Fixed Number of Cluster (Optional)"
                      withAsterisk
                      value={numberCluster === "" ? 'none' : Number(numberCluster)}
                      onChange={(val) => setNumberCluster(val?.toString() || "")}
                      placeholder="None"
                      min={1}
                      allowDecimal={false}
                    />
                </Group>
                <Group mt="md">
                  <Button
                    rightSection={<IconRefresh size={14} />}
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'cyan', deg: 90 }} 
                    onClick={updateHinaNetwork}
                  >
                    Update HINA Network
                  </Button>
                  <Button
                    rightSection={<IconRefresh size={14} />}
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'cyan', deg: 90 }}  
                    onClick={updateClusteredNetwork}
                  >
                    Update Clustered Network
                  </Button>
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
                          "text-margin-y": 0,
                          "text-halign": "center",
                          "text-valign": "center",
                          "color": "#000",
                          "text-background-color": "#fff",
                          "text-background-opacity": 1,
                          "text-background-padding": "2px",
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
                    <Button
                      // rightSection={<IconZoomIn size={14} />}
                      variant="gradient"
                      gradient={{ from: 'indigo', to: 'cyan', deg: 90 }}  
                      onClick={zoomIn} style={{ fontSize: "24px", margin: "2px" }}
                    >
                      +
                    </Button>
                    <Button
                      // rightSection={<IconZoomOut size={14} />}
                      variant="gradient"
                      gradient={{ from: 'indigo', to: 'cyan', deg: 90 }}  
                      onClick={zoomOut} style={{ fontSize: "24px", margin: "2px" }}
                    >
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
                                  <Table.Th
                                    style={{ textAlign: "center", cursor: "pointer" }}
                                    onClick={() => toggleSort("Attribute", qdSortConfig, setQdSortConfig)}
                                  >
                                    {attr1 || "Attribute 1"}{" "}
                                    {qdSortConfig?.key === "Attribute" ? (
                                      qdSortConfig.direction === "asc" ? (
                                        <IconSortAscending size={14} />
                                      ) : (
                                        <IconSortDescending size={14} />
                                      )
                                    ) : (
                                      <IconArrowsSort size={14} />
                                    )}
                                  </Table.Th>
                                  <Table.Th
                                    style={{ textAlign: "center", cursor: "pointer" }}
                                    onClick={() => toggleSort("Quantity", qdSortConfig, setQdSortConfig)}
                                  >
                                    Quantity{" "}
                                    {qdSortConfig?.key === "Quantity" ? (
                                      qdSortConfig.direction === "asc" ? (
                                        <IconSortAscending size={14} />
                                      ) : (
                                        <IconSortDescending size={14} />
                                      )
                                    ) : (
                                      <IconArrowsSort size={14} />
                                    )}
                                  </Table.Th>
                                  <Table.Th
                                    style={{ textAlign: "center", cursor: "pointer" }}
                                    onClick={() => toggleSort("Diversity", qdSortConfig, setQdSortConfig)}
                                  >
                                    Diversity{" "}
                                    {qdSortConfig?.key === "Diversity" ? (
                                      qdSortConfig.direction === "asc" ? (
                                        <IconSortAscending size={14} />
                                      ) : (
                                        <IconSortDescending size={14} />
                                      )
                                    ) : (
                                      <IconArrowsSort size={14} />
                                    )}
                                  </Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {qdTableData.map((row, idx) => (
                                  <Table.Tr key={idx}>
                                    <Table.Td style={{ textAlign: "center" }}>{row.Attribute}</Table.Td>
                                    <Table.Td style={{ textAlign: "center" }}>{row.Quantity}</Table.Td>
                                    <Table.Td style={{ textAlign: "center" }}>{row.Diversity}</Table.Td>
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
                                  Significant Edges ({dyadicAnalysis.length})
                                </Title>
                              </Accordion.Control>
                              <Accordion.Panel>
                                <Table highlightOnHover withTableBorder withColumnBorders>
                                  <Table.Thead>
                                    <Table.Tr>
                                      {["Node 1", "Node 2", "Weight"].map((col) => (
                                        <Table.Th
                                          key={col}
                                          style={{ textAlign: "center", cursor: "pointer" }}
                                          onClick={() =>
                                            toggleSort(
                                              col,
                                              dyadicSigSortConfig,
                                              setDyadicSigSortConfig
                                            )
                                          }
                                        >
                                          {col}{" "}
                                          {dyadicSigSortConfig?.key === col ? (
                                            dyadicSigSortConfig.direction === "asc" ? (
                                              <IconSortAscending size={14} />
                                            ) : (
                                              <IconSortDescending size={14} />
                                            )
                                          ) : (
                                            <IconArrowsSort size={14} />
                                          )}
                                        </Table.Th>
                                      ))}
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {dyadicSigTableData.map((row, idx) => (
                                      <Table.Tr key={idx}>
                                        <Table.Td style={{ textAlign: "center" }}>{row["Node 1"]}</Table.Td>
                                        <Table.Td style={{ textAlign: "center" }}>{row["Node 2"]}</Table.Td>
                                        <Table.Td style={{ textAlign: "center" }}>{row.Weight}</Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </Accordion.Panel>
                            </Accordion.Item>

                            {/* <Accordion.Item value="pruned">
                              <Accordion.Control>
                                <Title order={4}>
                                  Pruned Edges ({dyadicAnalysis.pruned_edges.length})
                                </Title>
                              </Accordion.Control>
                              <Accordion.Panel>
                                <Table highlightOnHover withTableBorder withColumnBorders>
                                  <Table.Thead>
                                    <Table.Tr>
                                      {["Node 1", "Node 2", "Weight"].map((col) => (
                                        <Table.Th
                                          key={col}
                                          style={{ textAlign: "center", cursor: "pointer" }}
                                          onClick={() =>
                                            toggleSort(
                                              col,
                                              dyadicPrunedSortConfig,
                                              setDyadicPrunedSortConfig
                                            )
                                          }
                                        >
                                          {col}{" "}
                                          {dyadicPrunedSortConfig?.key === col ? (
                                            dyadicPrunedSortConfig.direction === "asc" ? (
                                              <IconSortAscending size={14} />
                                            ) : (
                                              <IconSortDescending size={14} />
                                            )
                                          ) : (
                                            <IconArrowsSort size={14} />
                                          )}
                                        </Table.Th>
                                      ))}
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {dyadicPrunedTableData.map((row, idx) => (
                                      <Table.Tr key={idx}>
                                        <Table.Td style={{ textAlign: "center" }}>{row["Node 1"]}</Table.Td>
                                        <Table.Td style={{ textAlign: "center" }}>{row["Node 2"]}</Table.Td>
                                        <Table.Td style={{ textAlign: "center" }}>{row.Weight}</Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </Accordion.Panel>
                            </Accordion.Item> */}
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
                                  {["Node", "Cluster Label"].map((col) => (
                                    <Table.Th
                                      key={col}
                                      style={{ textAlign: "center", cursor: "pointer" }}
                                      onClick={() =>
                                        toggleSort(
                                          col,
                                          clusterSortConfig,
                                          setClusterSortConfig
                                        )
                                      }
                                    >
                                      {col}{" "}
                                      {clusterSortConfig?.key === col ? (
                                        clusterSortConfig.direction === "asc" ? (
                                          <IconSortAscending size={14} />
                                        ) : (
                                          <IconSortDescending size={14} />
                                        )
                                      ) : (
                                        <IconArrowsSort size={14} />
                                      )}
                                    </Table.Th>
                                  ))}
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {clusterTableData.map((row, idx) => (
                                  <Table.Tr key={idx}>
                                    <Table.Td style={{ textAlign: "center" }}>{row.Node}</Table.Td>
                                    <Table.Td style={{ textAlign: "center" }}>{row["Cluster Label"]}</Table.Td>
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
                    {hasExportData && (
                      <Group mt="md" p={10}>
                        <Button 
                          rightSection={<IconDownload size={14} />}
                          variant="gradient"
                          gradient={{ from: 'indigo', to: 'cyan', deg: 90 }} 
                          onClick={exportToXLSX}
                        >
                          Export Results
                        </Button>
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
