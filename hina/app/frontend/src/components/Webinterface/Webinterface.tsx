import React, { useState } from "react";
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
  Burger
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { MantineLogo } from '@mantinex/mantine-logo';
import { NavbarMinimalColored } from '../Navbar/NavbarMinimalColored';


// Define an interface for Quantity & Diversity data:
interface QDData {
  quantity: Record<string, number>;
  diversity: Record<string, number>;
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
    { value: "set1", label: "Set 1" },
    { value: "set2", label: "Set 2" },
    { value: "none", label: "None" },
];

export function Webinterface() {
  // useDisclosure hook for toggling the navbar
  const [opened, { toggle }] = useDisclosure();

  // State declarations with types
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
  const [fixDeg, setFixDeg] = useState<string>("set1");
  const [layout, setLayout] = useState<string>("spring");
  const [zoom, setZoom] = useState<number>(1);
  const [qdData, setQdData] = useState<QDData | null>(null);

  // Handle file upload using Mantine's FileInput component
  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("File uploaded successfully:", res.data);
      const groupOptions: string[] = ["All", ...res.data.groups.filter((g: string) => g !== "All")];
      setGroups(groupOptions);
      setColumns(res.data.columns);
      setUploadedData(res.data.data);
    } catch (error) {
      console.error("Error during file upload:", error);
    }
  };

  // Update HINA network endpoint
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
    params.append("weight_col", weight);
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

  return (
    <AppShell
    padding="md"
    // header={{ height: 60 }}
    navbar={{ width: 180, breakpoint: "md", collapsed: { mobile: !opened } }} 
    >
        {/* <AppShell.Header>
            <Group style={{ width: "100%" }}>
                <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                <MantineLogo size={40} />
                <Title order={2}>HINA Visualization</Title>
            </Group>
        </AppShell.Header> */}

        <AppShell.Navbar p="sm">
            <NavbarMinimalColored />  
        </AppShell.Navbar>

        <AppShell.Main>
            <Container fluid bg="var(--mantine-color-blue-light)">
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
                                onChange={(value) => setFixDeg(value || "set1")}
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

                <Paper withBorder shadow="sm" style={{ position: "relative", height: "1200px", marginBottom: "20px" }}>
                    <CytoscapeComponent
                    elements={elements}
                    style={{ width: "100%", height: "100%" }}
                    layout={{ name: "preset" }}
                    zoom={zoom}
                    userZoomingEnabled={false}
                    userPanningEnabled={true}
                    />
                        <div
                        style={{
                            position: "absolute",
                            bottom: "10px",
                            right: "10px",
                            zIndex: 999,
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
            </Container>
        </AppShell.Main>
    </AppShell>
  );
};
