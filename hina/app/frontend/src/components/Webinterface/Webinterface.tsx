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
  Menu,
  ActionIcon,
  Switch
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
  const [initialRenderDone, setInitialRenderDone] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [elements, setElements] = useState<any[]>([]);
  const [groupCol, setGroupCol] = useState<string>("none");
  const [group, setGroup] = useState<string>("All");
  const [groups, setGroups] = useState<string[]>([]);
  const [student, setStudent] = useState<string>("");
  const [object1, setObject1] = useState<string>("");
  const [object2, setObject2] = useState<string>("none");
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
  const [clusterOptions, setClusterOptions] = useState<string[]>(["All"]);
  const [activeTab, setActiveTab] = useState<string | null>("node-level");
  const cyRef = useRef<any>(null);
  const originalElementsRef = useRef<any[]>([]);
  
  interface QDData {
    quantity: Record<string, number>;
    normalized_quantity: Record<string, number>;
    diversity: Record<string, number>;
    quantity_by_category?: Record<string, Record<string, number>>;
    normalized_quantity_by_group?: Record<string, number>;
  }
  interface DyadicAnalysisData {
    significant_edges: [string, string, number][];
    // pruned_edges: [string, string, number][];
  }

  interface ClusterLabelsData {
    [node: string]: string;
  }

  type SortConfig = { key: string; direction: "asc" | "desc" } | null;

  const [quantitySortConfig, setQuantitySortConfig] = useState<SortConfig>(null);
  const [diversitySortConfig, setDiversitySortConfig] = useState<SortConfig>(null);
  const [normalizedQuantitySortConfig, setNormalizedQuantitySortConfig] = useState<SortConfig>(null);
  const [categoryQuantitySortConfig, setCategoryQuantitySortConfig] = useState<SortConfig>(null);
  const [normalizedGroupSortConfig, setNormalizedGroupSortConfig] = useState<SortConfig>(null);  
  const [dyadicSigSortConfig, setDyadicSigSortConfig] = useState<SortConfig>(null);
  const [clusterSortConfig, setClusterSortConfig] = useState<SortConfig>(null);
  const [objectObjectGraphs, setObjectObjectGraphs] = useState<Record<string, any>>({});
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [communityOptions, setCommunityOptions] = useState<string[]>([]);
  const [currentNetworkView, setCurrentNetworkView] = useState<'hina' | 'cluster' | 'object' | null>(null);
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showEdgeWeights, setShowEdgeWeights] = useState<boolean>(true);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);



  const LAYOUT_OPTIONS = [
    { value: "spring", label: "Spring" },
    { value: "bipartite", label: "Bipartite" },
    { value: "circular", label: "Circular" },
  ];

  const PRUNING_OPTIONS = [
    { value: "none", label: "No Pruning" },
    { value: "custom", label: "Custom Pruning" },
  ];

  const DEG_OPTIONS = useMemo(() => {
    const options = [
      { value: "none", label: "None" }
    ];
    
    if (student) {
      options.push({ value: "student_column", label: `Student: ${student}` });
    }
    
    if (object1) {
      options.push({ value: "object1_column", label: `Object 1: ${object1}` });
    }
    
    if (object2) {
      options.push({ value: "object2_column", label: `Object 2: ${object2}` });
    }
    return options;
  }, [student, object1, object2]);
  
  // Filter available columns for each dropdown
  const getAvailableColumns = (currentField: string): string[] => {
    const selectedValues = [
      currentField !== 'student' ? student : null,
      currentField !== 'object1' ? object1 : null,
      currentField !== 'object2' ? object2 : null,
      currentField !== 'attr' ? (attr !== 'none' ? attr : null) : null,
      currentField !== 'groupCol' ? (groupCol !== 'none' ? groupCol : null) : null
    ].filter(Boolean) as string[];
    return columns.filter(col => !selectedValues.includes(col));
  };

  // Update groups based on the uploaded data and group column
  const updateGroups = (data: string, groupColumn: string) => {
    if (!data || groupColumn === "none") {
      setGroups(["All"]);
      return;
    }
    try {
      const df = JSON.parse(data);
      const columnValues = df.data.map((row: any, index: number) => {
        const colIndex = df.columns.indexOf(groupColumn);
        return colIndex >= 0 ? String(row[colIndex]) : undefined;
      }).filter((value: any) => value !== undefined);      
      const uniqueValues = [...new Set(columnValues)];
      const groupOptions: string[] = ["All", ...uniqueValues.filter((g: string) => g !== "All")];
      setGroups(groupOptions);
    } catch (error) {
      console.error("Error updating groups:", error);
      setGroups(["All"]);
    }
  };
  
  // Handle file upload using Mantine's FileInput component
  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });      
      setColumns(res.data.columns);
      setUploadedData(res.data.data);
      const defaultGroups = ["All", ...res.data.groups.filter((g: string) => g !== "All")];
      setGroups(defaultGroups);
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
    let fixDegValue = fixDeg;
    if (fixDeg === "student_column") {
        fixDegValue = student;
    } else if (fixDeg === "object1_column") {
        fixDegValue = object1;
    } else if (fixDeg === "object2_column") {
        fixDegValue = object2;
    }
    params.append("data", uploadedData);
    params.append("group_col", groupCol); 
    params.append("group", group);
    params.append("student_col", student);  
    params.append("object1_col", object1);  
    params.append("object2_col", object2); 
    params.append("attr_col", attr); 
    params.append("pruning", pruning);
    params.append("alpha", alpha.toString());
    params.append("fix_deg", fixDegValue);
    params.append("layout", layout);  

    try {
      const res = await axios.post("/build-hina-network", params);
      setElements(res.data.elements);
      setCurrentNetworkView('hina');
      if (res.data.significant_edges) {
        setDyadicAnalysis(res.data.significant_edges);
      } else {
        setDyadicAnalysis(null);
      }
      fetchQuantityAndDiversity();
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
    params.append("object2_col", object2); 
    params.append("number_cluster", numberCluster);
    params.append("pruning", pruning);
    params.append("alpha", alpha.toString());
    params.append("fix_deg", fixDeg);
    params.append("layout", layout);
    try {
      const res = await axios.post("/build-cluster-network", params);
      originalElementsRef.current = [...res.data.elements];
      setElements(res.data.elements);
      setCurrentNetworkView('cluster');
      if (res.data.cluster_labels) {
        setClusterLabels(res.data.cluster_labels);
      } else {
        setClusterLabels(null);
      }
      // Handle significant edges from cluster result
      if (res.data.significant_edges) {
        setDyadicAnalysis(res.data.significant_edges);
      } else {
        setDyadicAnalysis(null);
      }
      if (res.data.compression_ratio !== undefined) {
        setCompressionRatio(res.data.compression_ratio);
      } else {
        setCompressionRatio(null);
      }
      fetchQuantityAndDiversity();
    } catch (error) {
      console.error("Error updating Clustered network:", error);
    }
    try {
      const res = await axios.post("/build-cluster-network", params);
      originalElementsRef.current = [...res.data.elements];
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

  // Update Object network endpoint
  const updateObjectNetwork = async () => {
    if (!uploadedData) return;
    
    try {
      const params = new URLSearchParams();
      params.append("data", uploadedData);
      params.append("group", group);
      params.append("student_col", student);  
      params.append("object1_col", object1);  
      params.append("object2_col", object2); 
      params.append("number_cluster", numberCluster);
      params.append("pruning", pruning);
      params.append("alpha", alpha.toString());
      params.append("fix_deg", fixDeg);
      params.append("layout", layout);
      const clusterResult = await axios.post("/build-cluster-network", params);

      // Update cluster data from response
      if (clusterResult.data.cluster_labels) {
        setClusterLabels(clusterResult.data.cluster_labels);
      } else {
        setClusterLabels(null);
      }
      
      // Update compression ratio from response
      if (clusterResult.data.compression_ratio !== undefined) {
        setCompressionRatio(clusterResult.data.compression_ratio);
      } else {
        setCompressionRatio(null);
      }

      if (clusterResult.data.object_object_graphs && Object.keys(clusterResult.data.object_object_graphs).length > 0) {
        const graphs = clusterResult.data.object_object_graphs;
        setObjectObjectGraphs(graphs);
        const commIds = Object.keys(graphs);
        setCommunityOptions(commIds);
        const firstCommunityId = commIds[0];
        setSelectedCommunityId(firstCommunityId);
        const objectGraphsData = JSON.stringify(graphs);
        const objectParams = new URLSearchParams();
        objectParams.append("data", objectGraphsData);
        objectParams.append("community_id", firstCommunityId);
        objectParams.append("object1_col", object1);  
        objectParams.append("object2_col", object2); 
        objectParams.append("layout", layout);
        await fetchObjectGraph(objectParams);
        fetchQuantityAndDiversity();

      } else {
        console.warn("No object-object graphs found in the data");
      }
    } catch (error) {
      console.error("Error updating object network:", error);
      console.error("Error details:", error.response?.data || error.message);
    }
  };

  // Fetch a selected Object Graph
  const fetchObjectGraph = async (params: URLSearchParams) => {
    try {
      const res = await axios.post("/build-object-network", params);
      if (res && res.data && res.data.elements) {
        setElements(res.data.elements);
        setCurrentNetworkView('object');
        
        // Extract edge information for dyadic analysis
        const edges = res.data.elements.filter(el => el.data.source);
        if (edges.length > 0) {
          const significantEdges = edges.map(edge => [
            edge.data.source,
            edge.data.target,
            edge.data.weight || 1
          ]);
          // Update dyadic analysis with object graph edges
          setDyadicAnalysis(significantEdges);
          console.log(`Found ${significantEdges.length} edges for dyadic analysis`);
        } else {
          setDyadicAnalysis([]);
          console.log("No edges found in the object graph");
        }
      } else {
        console.error("Invalid response structure:", res);
      }
    } catch (error) {
      console.error("Error getting object graph:", error);
      console.error("Error details:", error.response?.data || error.message);
    }
  };

  // Update the selected community ID and Object Graph
  const handleCommunityChange = (value: string) => {
    setSelectedCommunityId(value);    
    if (value && objectObjectGraphs && Object.keys(objectObjectGraphs).length > 0) {
      const objectParams = new URLSearchParams();
      const objectGraphsData = JSON.stringify(objectObjectGraphs);
      objectParams.append("data", objectGraphsData);
      objectParams.append("community_id", value); 
      objectParams.append("object1_col", object1);
      objectParams.append("object2_col", object2);
      objectParams.append("layout", layout);
      fetchObjectGraph(objectParams);
    }
  };

  // Fetch Quantity & Diversity data endpoint
  const fetchQuantityAndDiversity = async () => {
    if (!uploadedData) return;
    const params = new URLSearchParams();
    params.append("data", uploadedData);
    params.append("student_col", student);
    params.append("object1_col", object1);
    params.append("object2_col", object2);
    params.append("attr_col", attr || "");
    params.append("group_col", groupCol || "");
    
    try {
      const res = await axios.post("/quantity-diversity", params);
      setQdData(res.data);
    } catch (error) {
      console.error("Error computing Quantity & Diversity:", error);
    }
  };

  // Zoom functions
  const zoomIn = () => {
    if (cyRef.current) {
      const currentZoom = cyRef.current.zoom();
      const newZoom = Math.min(currentZoom * 1.2, 3);
      cyRef.current.zoom(newZoom);
      setZoom(newZoom);
    }
  };  

  const zoomOut = () => {
    if (cyRef.current) {
      const currentZoom = cyRef.current.zoom();
      const newZoom = Math.max(currentZoom / 1.2, 0.1);
      cyRef.current.zoom(newZoom);
      setZoom(newZoom);
    }
  };

  const resetView = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.center();
      setZoom(cyRef.current.zoom());
    }
  };

  // Export to XLSX
  const exportToXLSX = () => {
    const wb = XLSX.utils.book_new();

    if (activeTab === "node-level") {
      if (!qdData) return;
      
      // Quantity
      const quantityData = [
        ["Student", "Quantity"],
        ...Object.keys(qdData.quantity).map((key) => [
          key,
          qdData.diversity[key],
        ]),
      ];
      const wsQuantity = XLSX.utils.aoa_to_sheet(quantityData);
      XLSX.utils.book_append_sheet(wb, wsQuantity, "Quantity");

      // Diversity
      const diversityData = [
        ["Student", "Diversity"],
        ...Object.keys(qdData.diversity).map((key) => [
          key,
          qdData.diversity[key],
        ]),
      ];
      const wsDiversity = XLSX.utils.aoa_to_sheet(diversityData);
      XLSX.utils.book_append_sheet(wb, wsDiversity, "Diversity");
      
      // Normalized quantity
      const normalizedData = [
        ["Student", "Normalized Quantity"],
        ...Object.entries(qdData.normalized_quantity).map(([key, value]) => [
          key, value
        ]),
      ];
      const wsNorm = XLSX.utils.aoa_to_sheet(normalizedData);
      XLSX.utils.book_append_sheet(wb, wsNorm, "Normalized Quantity");
      
      if (qdData.quantity_by_category) {
        const categoryData = [
          ["Node", "Category", "Value"],
        ];
        
        Object.entries(qdData.quantity_by_category).forEach(([node, categories]) => {
          Object.entries(categories).forEach(([category, value]) => {
            categoryData.push([node, category, value]);
          });
        });
        
        const wsCat = XLSX.utils.aoa_to_sheet(categoryData);
        XLSX.utils.book_append_sheet(wb, wsCat, "Quantity by Category");
      }
      
      if (qdData.normalized_quantity_by_group) {
        const groupData = [
          ["Student", "Normalized by Group"],
          ...Object.entries(qdData.normalized_quantity_by_group).map(([key, value]) => [
            key, value
          ]),
        ];
        const wsGroup = XLSX.utils.aoa_to_sheet(groupData);
        XLSX.utils.book_append_sheet(wb, wsGroup, "Normalized by Group");
      }
      XLSX.writeFile(wb, "quantity_and_diversity.xlsx");
    } else if (activeTab === "dyadic") {
      if (!dyadicAnalysis) return;
      const sigData = [
        ["Node 1", "Node 2", "Weight"],
        ...dyadicAnalysis.map((edge) => [edge[0], edge[1], edge[2]]),
      ];
      const wsSig = XLSX.utils.aoa_to_sheet(sigData);
      XLSX.utils.book_append_sheet(wb, wsSig, "Significant Edges");
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
      // Worksheet for community summary
      const numberOfClusters = new Set(Object.values(clusterLabels)).size;
      const compressionRatioValue = compressionRatio !== null ? 
        compressionRatio.toFixed(4) : "Not available";
      const summaryData = [
        ["Metric", "Value"],
        ["Number of Clusters", numberOfClusters],
        ["Community Quality (Compression Ratio)", compressionRatioValue]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Community Summary");
      XLSX.writeFile(wb, "mesoscale_clustering.xlsx");
    }
  };

  // Sorting function for table data
  const applySorting = <T extends Record<string, any>>(
    data: T[],
    sortConfig: SortConfig,
    numericColumns: string[] = []
  ): T[] => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const key = sortConfig.key;
      const valueA = a[key];
      const valueB = b[key];      
      if (numericColumns.includes(key)) {
        const numA = !isNaN(Number(valueA)) ? Number(valueA) : null;
        const numB = !isNaN(Number(valueB)) ? Number(valueB) : null;        
        if (numA !== null && numB !== null) {
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        }
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          const lastPartA = valueA.split('_').pop() || '';
          const lastPartB = valueB.split('_').pop() || '';
          const extractedA = parseInt(lastPartA, 10);
          const extractedB = parseInt(lastPartB, 10);
          if (!isNaN(extractedA) && !isNaN(extractedB)) {
            return sortConfig.direction === "asc" ? extractedA - extractedB : extractedB - extractedA;
          }
        }
      }
      if (valueA < valueB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Compute sorted data for Node-Level table
  const quantityTableData = useMemo(() => {
    if (!qdData?.quantity) return [];
    const data = Object.entries(qdData.quantity).map(([key, value]) => ({
      Student: key,
      Quantity: value
    }));
    // "Quantity" is a numeric column
    return applySorting(data, quantitySortConfig, ["Quantity"]);
  }, [qdData?.quantity, quantitySortConfig]);

  // Sorted data for Diversity table
  const diversityTableData = useMemo(() => {
    if (!qdData?.diversity) return [];
    const data = Object.entries(qdData.diversity).map(([key, value]) => ({
      Student: key,
      Diversity: value
    }));
    return applySorting(data, diversitySortConfig, ["Diversity"]);
  }, [qdData?.diversity, diversitySortConfig]);

  // Sorted data for Normalized Quantity table
  const normalizedQuantityTableData = useMemo(() => {
    if (!qdData?.normalized_quantity) return [];
    const data = Object.entries(qdData.normalized_quantity).map(([key, value]) => ({
      Student: key,
      "Normalized Quantity": value
    }));
    return applySorting(data, normalizedQuantitySortConfig, ["Normalized Quantity"]);
  }, [qdData?.normalized_quantity, normalizedQuantitySortConfig]);
  
  // Sorted data for Category Quantity table
  const categoryQuantityTableData = useMemo(() => {
    if (!qdData?.quantity_by_category) return [];
    const data: { Student: string; Category: string; Value: number }[] = [];
    
    Object.entries(qdData.quantity_by_category).forEach(([node, categories]) => {
      Object.entries(categories).forEach(([category, value]) => {
        data.push({
          Student: node,
          Category: category,
          Value: value as number
        });
      });
    });
    return applySorting(data, categoryQuantitySortConfig, ["Value"]);
  }, [qdData?.quantity_by_category, categoryQuantitySortConfig]);
  

  // Sorted data for Normalized Quantity by Group table
  const normalizedGroupTableData = useMemo(() => {
    if (!qdData?.normalized_quantity_by_group) return [];
    const data = Object.entries(qdData.normalized_quantity_by_group).map(([key, value]) => ({
      Student: key,
      "Normalized Quantity": value
    }));
    return applySorting(data, normalizedGroupSortConfig, ["Normalized Quantity"]);
  }, [qdData?.normalized_quantity_by_group, normalizedGroupSortConfig]);
  
  // Compute sorted data for Dyadic Analysis Significant Edges table
  const dyadicSigTableData = useMemo(() => {
    if (!dyadicAnalysis) return [];
    const data = dyadicAnalysis.map((edge) => ({
      "Node 1": edge[0],
      "Node 2": edge[1],
      Weight: edge[2],
    }));
    return applySorting(data, dyadicSigSortConfig, ["Weight"]);
  }, [dyadicAnalysis, dyadicSigSortConfig]);
  
  // Compute sorted data for Mesoscale Clustering table
  const clusterTableData = useMemo(() => {
    if (!clusterLabels) return [];
    const data = Object.keys(clusterLabels).map((node) => ({
      Node: node,
      "Cluster Label": clusterLabels[node],
    }));
    return applySorting(data, clusterSortConfig, ["Cluster Label"]);
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

  const handleGroupChange = (value: string | null) => {
    const newValue = value || "All";
    setGroup(newValue);
    if (uploadedData) {
      const params = new URLSearchParams();
      params.append("data", uploadedData);
      params.append("group_col", groupCol); 
      params.append("group", newValue);  
      params.append("student_col", student);  
      params.append("object1_col", object1);  
      params.append("attr_col", attr); 
      params.append("pruning", pruning);
      params.append("alpha", alpha.toString());
      params.append("fix_deg", fixDeg);
      params.append("layout", layout);  
  
      axios.post("/build-hina-network", params)
        .then(res => {
          setElements(res.data.elements);
          if (res.data.significant_edges) {
            setDyadicAnalysis(res.data.significant_edges);
          } else {
            setDyadicAnalysis(null);
          }
          fetchQuantityAndDiversity();
        })
        .catch(error => {
          console.error("Error updating HINA network:", error);
        });
    }
  };

  // Updated handleClusterChange function
  const handleClusterChange = (value: string | null) => {
    const newValue = value || "All";
    setCluster(newValue);
    const fullElements = originalElementsRef.current;        
    if (newValue === "All") {
      setElements([...fullElements]);
      return;
    }    
    const filteredStudentIds = Object.entries(clusterLabels || {})
      .filter(([node, label]) => String(label) === newValue)
      .map(([node]) => node);

    if (filteredStudentIds.length === 0) {
      setElements([...fullElements]);
      return;
    }
    const studentIdSet = new Set(filteredStudentIds);
    // Get student nodes in the selected cluster
    const filteredStudentNodes = fullElements.filter(el => 
      !el.data.source && studentIdSet.has(el.data.id)
    );
    // Find edges connecting to filtered student nodes
    const filteredEdges = fullElements.filter(el => 
      el.data.source && (studentIdSet.has(el.data.source) || studentIdSet.has(el.data.target))
    );    
    const connectedNodeIds = new Set<string>();
    filteredEdges.forEach(edge => {
      connectedNodeIds.add(edge.data.source);
      connectedNodeIds.add(edge.data.target);
    });
    // Find object nodes that are connected to students in the selected cluster
    const filteredObjectNodes = fullElements.filter(el => 
      !el.data.source && 
      !studentIdSet.has(el.data.id) &&
      connectedNodeIds.has(el.data.id)
    );  
    const newElements = [...filteredStudentNodes, ...filteredObjectNodes, ...filteredEdges];
    setElements(newElements);
  };
  
// NetworkFilters component to render the graph filter
const NetworkFilters = () => {
  if (!elements.length) return null;
  
  const filterPaperStyle = {
    background: 'transparent',  // transparent
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
            data={clusterOptions.map(label => ({ value: label, label }))}
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

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <Paper 
    p="xs" 
    mb="xs" 
    style={{ 
      background: 'linear-gradient(to right, #4263eb, #00b5fa)',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}
  >
    <Title order={4} c="white" fw={600} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
      {children}
    </Title>
  </Paper>
);

useEffect(() => {
  if (!cyRef.current) return;
  const cy = cyRef.current;
  
  const handleTap = (evt: any) => {
    const clickedNode = evt.target;
    const clickedNodeId = clickedNode.id();
    if (highlightedNodeId === clickedNodeId) {
      cy.elements().removeClass("highlight");
      setHighlightedNodeId(null);
    } else {
      cy.elements().removeClass("highlight");
      
      // Add highlight to the clicked node
      clickedNode.addClass("highlight");
      setHighlightedNodeId(clickedNodeId);
      
      // Highlight connected edges
      const connectedEdges = clickedNode.connectedEdges();
      connectedEdges.addClass("highlight");
      
      // Highlight nodes connected to this node
      const connectedNodes = clickedNode.neighborhood('node');
      connectedNodes.addClass("highlight");
    }
  };
  
  const handleBackgroundTap = (evt: any) => {
    if (evt.target === cy) {
      cy.elements().removeClass("highlight");
      setHighlightedNodeId(null);
    }
  };
  
  cy.on("tap", "node", handleTap);
  cy.on("tap", handleBackgroundTap);
  
  return () => {
    cy.removeListener("tap", "node", handleTap);
    cy.removeListener("tap", handleBackgroundTap);
  };
}, [elements, highlightedNodeId]);

useEffect(() => {
  if (!cyRef.current || highlightedNodeId === null) return;
  
  const cy = cyRef.current;
  let opacity = 0.7;
  let increasing = true;
  let animationFrameId: number;
  
  const animate = () => {
    if (highlightedNodeId === null) return;
    
    if (opacity >= 1) increasing = false;
    if (opacity <= 0.5) increasing = true;
    
    opacity += increasing ? 0.015 : -0.015;
    const highlightedNode = cy.$(`node[id="${highlightedNodeId}"]`);
    if (highlightedNode && highlightedNode.length > 0) {
      highlightedNode.style('border-opacity', opacity);
    }
    animationFrameId = requestAnimationFrame(animate);
  };
  animationFrameId = requestAnimationFrame(animate);
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}, [highlightedNodeId]);

  useEffect(() => {
    if (uploadedData && groupCol !== "none") {
      updateGroups(uploadedData, groupCol);
    }
  }, [groupCol, uploadedData]);

  useEffect(() => {
    if (elements.length > 0) {
      setInitialRenderDone(false);
      if (originalElementsRef.current.length === 0) {
        originalElementsRef.current = [...elements];
      }
    }
  }, [elements]);

  useEffect(() => {
    if (!["none", student, object1, object2].includes(fixDeg)) {
      setFixDeg("none");
    }
  }, [student, object1, object2]);

  useEffect(() => {
    if (clusterLabels) {
      let uniqueValues = [...new Set(Object.values(clusterLabels))].map(val => String(val));      
      uniqueValues = uniqueValues.sort((a, b) => {
        const numA = !isNaN(Number(a)) ? Number(a) : null;
        const numB = !isNaN(Number(b)) ? Number(b) : null;        
        if (numA !== null && numB !== null) {
          return numA - numB;
        }        
        const lastPartA = a.split('_').pop() || '';
        const lastPartB = b.split('_').pop() || '';
        const extractedA = parseInt(lastPartA, 10);
        const extractedB = parseInt(lastPartB, 10);
        if (!isNaN(extractedA) && !isNaN(extractedB)) {
          return extractedA - extractedB;
        }        
        return a.localeCompare(b);
      });
      setClusterOptions(["All", ...uniqueValues]);
      setCluster("All");
    } else {
      setClusterOptions(["All"]);
    }
  }, [clusterLabels]);


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
                {/* DATA INPUTS SECTION */}
                <SectionHeader>Data Inputs</SectionHeader>
                <Group grow>
                  <Select
                    label="Student Column"
                    value={student}
                    onChange={(value) => setStudent(value || "")}
                    data={Array.from(new Set([...getAvailableColumns('student'), ...(student ? [student] : [])]))}
                  />
                  <Select
                    label="Object 1 Column"
                    value={object1}
                    onChange={(value) => setObject1(value || "")}
                    data={Array.from(new Set([...getAvailableColumns('object1'), ...(object1 ? [object1] : [])]))}
                  />
                  <Select
                    label="Object 2 Column (For Tripartite)"
                    withAsterisk
                    value={object2}
                    onChange={(value) => setObject2(value || "none")}
                    data={[{value: "none", label: "None"}].concat(
                      Array.from(new Set([...getAvailableColumns('object2'), ...(object2 && object2 !== "none" ? [object2] : [])]))
                      .map(col => ({value: col, label: col}))
                    )}
                  />
                </Group>

                <Group grow mt="md" mb="md">
                  <Select
                    label="Object Attribute (Optional)"
                    withAsterisk
                    value={attr}
                    onChange={(value) => setAttr(value || "none")}
                    data={[{value: "none", label: "None"}].concat(
                      Array.from(new Set([...getAvailableColumns('attr'), ...(attr && attr !== "none" ? [attr] : [])]))
                      .map(col => ({value: col, label: col}))
                    )}
                  />
                  <Select
                    label="Group Column (Optional)"
                    withAsterisk
                    value={groupCol}
                    onChange={(value) => setGroupCol(value || "none")}
                    data={[{value: "none", label: "None"}].concat(
                      Array.from(new Set([...getAvailableColumns('groupCol'), ...(groupCol && groupCol !== "none" ? [groupCol] : [])]))
                      .map(col => ({value: col, label: col}))
                    )}
                  />
                </Group>

                {/* VISUALIZATION PARAMETERS SECTION */}
                <SectionHeader>Visualization Parameters</SectionHeader>
                <Group grow>
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
                        placeholder="Alpha"
                        step={0.01}
                      />
                      <Select
                        label="Fix Deg"
                        value={fixDeg}
                        onChange={(value) => setFixDeg(value || "None")}
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
                    label="Fixed Number of Cluster"
                    withAsterisk
                    value={numberCluster === "" ? 'none' : Number(numberCluster)}
                    onChange={(val) => setNumberCluster(val?.toString() || "")}
                    placeholder="None"
                    min={1}
                    allowDecimal={false}
                  />
                </Group>

                {/* BUTTONS SECTION */}
                <Group mt="xl">
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
                  <Button
                    rightSection={<IconRefresh size={14} />}
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'cyan', deg: 90 }}  
                    onClick={updateObjectNetwork}
                    disabled={object2 === "none"}
                  >
                    Update Tripartite Network
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
                  <div style={{ position: "absolute", top: "5px", left: "10px", zIndex: 999 }}>
                    <NetworkFilters />
                  </div>
                  <CytoscapeComponent
                    elements={elements}
                    style={{ width: "100%", height: "100%" }}
                    layout={{ name: "preset" }}
                    // zoom={zoom}
                    userZoomingEnabled={false}
                    userPanningEnabled={true}
                    stylesheet={[
                      {
                        selector: "node",
                        style: {
                          "background-color": "data(color)",
                          "border-width": 1,
                          "border-color": "#000000",
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
                          "shadow-blur": 10,
                          "shadow-color": "data(color)",
                          "shadow-opacity": 0.9,
                          "shadow-offset-x": 0,
                          "shadow-offset-y": 0
                        },
                      },
                      {
                        selector: "edge",
                        style: {
                          "line-color": "#ccc",
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
                        mb="xs"                    
                      >
                        <IconZoomOut />
                      </ActionIcon>
                    </div>
                  )}
                </Paper>
              </Grid.Col>

              <Grid.Col span={4}>
                {/* Right Panel for Analytical Results */}
                <ScrollArea h={700}>
                  <Paper withBorder shadow="sm">
                    <Tabs value={activeTab} onChange={setActiveTab}>
                      <Tabs.List>
                        <Tabs.Tab value="node-level">Node-Level</Tabs.Tab>
                        <Tabs.Tab value="dyadic">Dyadic Analysis</Tabs.Tab>
                        <Tabs.Tab value="cluster">Mesoscale Clustering</Tabs.Tab>
                      </Tabs.List>

                      {/* Node-Level Tab Content */}
                      <Tabs.Panel value="node-level">
                        {activeTab === "node-level" && qdData && (
                          <Accordion transitionDuration={500}>

                            {/* Quantity Table */}
                            <Accordion.Item value="quantity">
                              <Accordion.Control>
                                <Title order={4}>Quantity</Title>
                              </Accordion.Control>
                              <Accordion.Panel>
                                <Table highlightOnHover withTableBorder withColumnBorders>
                                  <Table.Thead>
                                    <Table.Tr>
                                      {["Student", "Quantity"].map((col) => (
                                        <Table.Th
                                          key={col}
                                          style={{ textAlign: col === "Quantity" ? "center" : "left", cursor: "pointer" }}
                                          onClick={() => toggleSort(col, quantitySortConfig, setQuantitySortConfig)}
                                        >
                                          {col}{" "}
                                          {quantitySortConfig?.key === col ? (
                                            quantitySortConfig.direction === "asc" ? (
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
                                    {quantityTableData.map((row, idx) => (
                                      <Table.Tr key={idx}>
                                        <Table.Td>{row.Student}</Table.Td>
                                        <Table.Td style={{ textAlign: "center" }}>{row.Quantity.toFixed(2)}</Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </Accordion.Panel>
                            </Accordion.Item>

                            {/* Diversity Table */}
                            <Accordion.Item value="diversity">
                              <Accordion.Control>
                                <Title order={4}>Diversity</Title>
                              </Accordion.Control>
                              <Accordion.Panel>
                                <Table highlightOnHover withTableBorder withColumnBorders>
                                  <Table.Thead>
                                    <Table.Tr>
                                      {["Student", "Diversity"].map((col) => (
                                        <Table.Th
                                          key={col}
                                          style={{ textAlign: col === "Diversity" ? "center" : "left", cursor: "pointer" }}
                                          onClick={() => toggleSort(col, diversitySortConfig, setDiversitySortConfig)}
                                        >
                                          {col}{" "}
                                          {diversitySortConfig?.key === col ? (
                                            diversitySortConfig.direction === "asc" ? (
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
                                    {diversityTableData.map((row, idx) => (
                                      <Table.Tr key={idx}>
                                        <Table.Td>{row.Student}</Table.Td>
                                        <Table.Td style={{ textAlign: "center" }}>{row.Diversity.toFixed(4)}</Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </Accordion.Panel>
                            </Accordion.Item>

                            {/* Normalized Quantity Table */}
                            <Accordion.Item value="normalized-quantity">
                              <Accordion.Control>
                                <Title order={4}>Normalized Quantity</Title>
                              </Accordion.Control>
                              <Accordion.Panel>
                                <Table highlightOnHover withTableBorder withColumnBorders>
                                  <Table.Thead>
                                    <Table.Tr>
                                      {["Student", "Normalized Quantity"].map((col) => (
                                        <Table.Th
                                          key={col}
                                          style={{ textAlign: col === "Normalized Quantity" ? "center" : "left", cursor: "pointer" }}
                                          onClick={() => toggleSort(col, normalizedQuantitySortConfig, setNormalizedQuantitySortConfig)}
                                        >
                                          {col}{" "}
                                          {normalizedQuantitySortConfig?.key === col ? (
                                            normalizedQuantitySortConfig.direction === "asc" ? (
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
                                    {normalizedQuantityTableData.map((row, idx) => (
                                      <Table.Tr key={idx}>
                                        <Table.Td>{row.Student}</Table.Td>
                                        <Table.Td style={{ textAlign: "center" }}>{row["Normalized Quantity"].toFixed(4)}</Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </Accordion.Panel>
                            </Accordion.Item>

                            {/* Quantity by Category Table */}
                            {qdData.quantity_by_category && (
                              <Accordion.Item value="quantity-by-category">
                                <Accordion.Control>
                                  <Title order={4}>Quantity by Category</Title>
                                </Accordion.Control>
                                <Accordion.Panel>
                                  <Table highlightOnHover withTableBorder withColumnBorders>
                                    <Table.Thead>
                                      <Table.Tr>
                                        {["Student", "Category", "Value"].map((col) => (
                                          <Table.Th
                                            key={col}
                                            style={{ textAlign: col === "Value" ? "center" : "left", cursor: "pointer" }}
                                            onClick={() => toggleSort(col, categoryQuantitySortConfig, setCategoryQuantitySortConfig)}
                                          >
                                            {col}{" "}
                                            {categoryQuantitySortConfig?.key === col ? (
                                              categoryQuantitySortConfig.direction === "asc" ? (
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
                                      {categoryQuantityTableData.map((row, idx) => (
                                        <Table.Tr key={`cat-${idx}`}>
                                          <Table.Td>{row.Student}</Table.Td>
                                          <Table.Td>{row.Category}</Table.Td>
                                          <Table.Td style={{ textAlign: "center" }}>{row.Value.toFixed(2)}</Table.Td>
                                        </Table.Tr>
                                      ))}
                                    </Table.Tbody>
                                  </Table>
                                </Accordion.Panel>
                              </Accordion.Item>
                            )}

                            {/* Normalized Quantity by Group Table */}
                            {qdData.normalized_quantity_by_group && (
                              <Accordion.Item value="normalized-by-group">
                                <Accordion.Control>
                                  <Title order={4}>Normalized Quantity by Group</Title>
                                </Accordion.Control>
                                <Accordion.Panel>
                                  <Table highlightOnHover withTableBorder withColumnBorders>
                                    <Table.Thead>
                                      <Table.Tr>
                                        {["Student", "Normalized Quantity"].map((col) => (
                                          <Table.Th
                                            key={col}
                                            style={{ textAlign: col === "Normalized Quantity" ? "center" : "left", cursor: "pointer" }}
                                            onClick={() => toggleSort(col, normalizedGroupSortConfig, setNormalizedGroupSortConfig)}
                                          >
                                            {col}{" "}
                                            {normalizedGroupSortConfig?.key === col ? (
                                              normalizedGroupSortConfig.direction === "asc" ? (
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
                                      {normalizedGroupTableData.map((row, idx) => (
                                        <Table.Tr key={idx}>
                                          <Table.Td>{row.Student}</Table.Td>
                                          <Table.Td style={{ textAlign: "center" }}>{row["Normalized Quantity"].toFixed(4)}</Table.Td>
                                        </Table.Tr>
                                      ))}
                                    </Table.Tbody>
                                  </Table>
                                </Accordion.Panel>
                              </Accordion.Item>
                            )}

                          </Accordion>
                        )}
                      </Tabs.Panel>

                      {/* Dyadic Analysis Tab Content */}
                      <Tabs.Panel value="dyadic">
                      {dyadicAnalysis ? (
                        <Paper withBorder shadow="sm" p="md">
                        <Title order={3} mb="md">
                          Significant Edges ({dyadicAnalysis.length})
                        </Title>
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
                        </Paper>
                      ) : (
                        <Text>No Dyadic analysis data available.</Text>
                      )}
                      </Tabs.Panel>

                      {/* Mesoscale Clustering Tab Content */}
                      <Tabs.Panel value="cluster">
                        {clusterLabels ? (
                          <Accordion transitionDuration={500}>
                            {/* Cluster Labels Table */}
                            <Accordion.Item value="cluster-labels">
                              <Accordion.Control>
                                <Title order={4}>Cluster Labels</Title>
                              </Accordion.Control>
                              <Accordion.Panel>
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
                              </Accordion.Panel>
                            </Accordion.Item>

                            {/* Community Summary */}
                            <Accordion.Item value="community-summary">
                              <Accordion.Control>
                                <Title order={4}>Community Summary</Title>
                              </Accordion.Control>
                              <Accordion.Panel>
                                <Table highlightOnHover withTableBorder withColumnBorders>
                                  <Table.Thead>
                                    <Table.Tr>
                                      <Table.Th style={{ textAlign: "center" }}>Metric</Table.Th>
                                      <Table.Th style={{ textAlign: "center" }}>Value</Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    <Table.Tr>
                                      <Table.Td style={{ textAlign: "center" }}>Number of Clusters</Table.Td>
                                      <Table.Td style={{ textAlign: "center" }}>
                                        {new Set(Object.values(clusterLabels)).size}
                                      </Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                      <Table.Td style={{ textAlign: "center" }}>Community Quality (Compression Ratio)</Table.Td>
                                      <Table.Td style={{ textAlign: "center" }}>
                                        {compressionRatio !== null 
                                          ? compressionRatio.toFixed(4) 
                                          : "Not available"}
                                      </Table.Td>
                                    </Table.Tr>
                                  </Table.Tbody>
                                </Table>
                              </Accordion.Panel>
                            </Accordion.Item>
                          </Accordion>
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
