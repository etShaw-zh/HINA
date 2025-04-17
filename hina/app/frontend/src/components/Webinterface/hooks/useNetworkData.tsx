import { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { notifications } from '@mantine/notifications';
import { IconExclamationCircle, IconTimeline } from '@tabler/icons-react';
import { rem } from '@mantine/core';


// Set axios base URL for local development
// axios.defaults.baseURL = 'http://localhost:8000';

// Types
interface QDData {
	quantity: Record<string, number>;
	normalized_quantity: Record<string, number>;
	diversity: Record<string, number>;
	quantity_by_category?: Record<string, Record<string, number>>;
	normalized_quantity_by_group?: Record<string, number>;
}

interface DyadicAnalysisData {
	significant_edges: [string, string, number][];
}

interface ClusterLabelsData {
  	[node: string]: string;
}

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

export function useNetworkData() {
    // Basic state
    const [uploadedData, setUploadedData] = useState<string | null>(null);
    const [initialRenderDone, setInitialRenderDone] = useState(false);
    const [columns, setColumns] = useState<string[]>([]);
    const [elements, setElements] = useState<any[]>([]);
    
    // Loading state
    const [loading, setLoading] = useState(false);
    const [nodeLevelLoading, setNodeLevelLoading] = useState(false);
    const [dyadicLoading, setDyadicLoading] = useState(false);
    const [clusterLoading, setClusterLoading] = useState(false);
    
    // Input parameters
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [groupCol, _setGroupCol] = useState<string>("none");
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
    const [fixDeg, setFixDeg] = useState<string>("none");
    const [layout, setLayout] = useState<string>("bipartite");
    
    // Network visualization
    const [zoom, setZoom] = useState<number>(1);
    const [showLabels, setShowLabels] = useState<boolean>(true);
    const [showEdgeWeights, setShowEdgeWeights] = useState<boolean>(true);
    const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
    const [currentNetworkView, setCurrentNetworkView] = useState<'hina' | 'cluster' | 'object' | null>(null);
    
    // Node size states
    const [studentNodeSize, setStudentNodeSize] = useState<number>(20);
    const [objectNodeSize, setObjectNodeSize] = useState<number>(20);
    const [object1NodeSize, setObject1NodeSize] = useState<number>(20);
    const [object2NodeSize, setObject2NodeSize] = useState<number>(20);
    const [isObjectOnlyMode, setIsObjectOnlyMode] = useState<boolean>(false);
    
    // Analysis data
    const [qdData, setQdData] = useState<QDData | null>(null);
    const [dyadicAnalysis, setDyadicAnalysis] = useState<DyadicAnalysisData | null>(null);
    const [clusterLabels, setClusterLabels] = useState<ClusterLabelsData | null>(null);
    const [clusterOptions, setClusterOptions] = useState<string[]>(["All"]);
    const [activeTab, setActiveTab] = useState<string | null>("node-level");
    const [compressionRatio, setCompressionRatio] = useState<number | null>(null);
    const [objectObjectGraphs, setObjectObjectGraphs] = useState<Record<string, any>>({});
    const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
    const [communityOptions, setCommunityOptions] = useState<string[]>([]);
    
    // Sorting configurations
    const [quantitySortConfig, setQuantitySortConfig] = useState<SortConfig>(null);
    const [diversitySortConfig, setDiversitySortConfig] = useState<SortConfig>(null);
    const [normalizedQuantitySortConfig, setNormalizedQuantitySortConfig] = useState<SortConfig>(null);
    const [categoryQuantitySortConfig, setCategoryQuantitySortConfig] = useState<SortConfig>(null);
    const [normalizedGroupSortConfig, setNormalizedGroupSortConfig] = useState<SortConfig>(null);
    const [dyadicSigSortConfig, setDyadicSigSortConfig] = useState<SortConfig>(null);
    const [clusterSortConfig, setClusterSortConfig] = useState<SortConfig>(null);
    
    // Refs
    const cyRef = useRef<any>(null);
    const originalElementsRef = useRef<any[]>([]);
    const nodeSizesInitialized = useRef<boolean>(false);
    const prevNetworkView = useRef<'hina' | 'cluster' | 'object' | null>(null);

	// Constants for options
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

    const applyNodeSizes = () => {
        if (!cyRef.current) return;
        
        if (isObjectOnlyMode) {
            // Object-only mode
            cyRef.current.style()
                .selector("node[type='object1'], node.object1")
                .style({
                    'height': object1NodeSize,
                    'width': object1NodeSize
                })
                .update();
                
            cyRef.current.style()
                .selector("node[type='object2'], node.object2")
                .style({
                    'height': object2NodeSize,
                    'width': object2NodeSize
                })
                .update();
        } else {
            // Standard mode
            cyRef.current.style()
                .selector("node[type='student'], node.student")
                .style({
                    'height': studentNodeSize,
                    'width': studentNodeSize
                })
                .update();
            
            cyRef.current.style()
                .selector("node[type='object1'], node[type='object2'], node[type='object1_object2'], node.object1, node.object2, node.object1_object2")
                .style({
                    'height': objectNodeSize,
                    'width': objectNodeSize
                })
                .update();
        }
        cyRef.current.style()
            .selector("node.highlight")
            .style({
                'height': (ele) => {
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
                'width': (ele) => {
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
                }
            })
            .update();
    };

    // Function to store the filename and reset state
	const handleFileUpload = async (file: File | null) => {
		if (!file) return;  
		setSelectedFileName(file.name);

		const formData = new FormData();
		formData.append("file", file);
		
		try {
			const res = await axios.post("/upload", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			showSuccessNotification("File Uploaded", `Successfully uploaded ${file.name}`);

			const newColumns = res.data.columns;
			const newData = res.data.data;
			const newGroups = ["All", ...res.data.groups.filter((g: string) => g !== "All")];
			setElements([]);
			setCurrentNetworkView(null);
			setGroups(["All"]);
			setGroup("All");	  
			setStudent("none");
			setObject1("none");
			setObject2("none");
			setAttr("none");
			setGroupCol("none");
			setNumberCluster("");
			setCluster("All");
			setPruning("none");
			setAlpha(0.05);
			setFixDeg("none");
			setLayout("bipartite");
			
			// Reset analysis data
			setQdData(null);
			setDyadicAnalysis(null);
			setClusterLabels(null);
			setClusterOptions(["All"]);
			setActiveTab("node-level");
			setCompressionRatio(null);
			
			// Reset object network specific state
			setObjectObjectGraphs({});
			setSelectedCommunityId("");
			setCommunityOptions([]);
		
			// Reset visualization state
			setHighlightedNodeId(null);
			if (cyRef.current) {
				cyRef.current.elements().removeClass("highlight");
			}
			
			// Reset references
			originalElementsRef.current = [];
			
			// Reset sorting configurations
			setQuantitySortConfig(null);
			setDiversitySortConfig(null);
			setNormalizedQuantitySortConfig(null);
			setCategoryQuantitySortConfig(null);
			setNormalizedGroupSortConfig(null);
			setDyadicSigSortConfig(null);
			setClusterSortConfig(null);
			
			setColumns(newColumns);
			setUploadedData(newData);
			setGroups(newGroups);
		} catch (error) {
			console.error("Error during file upload:", error);
			showAPIErrorNotification("Upload Error", `Failed to upload ${file.name}: ${error.response?.data?.detail || error.message}`);
		}
	};

	// Error notification function
	const showAPIErrorNotification = (title: string, message: string) => {
		notifications.show({
			id: `error-${Date.now()}`,
			title,
			message,
			color: 'red',
			icon: <IconExclamationCircle />,
			withBorder: true,
			autoClose: 6000,
			withCloseButton: true,
			position: 'bottom-right',
		});
	};
	// Success notification function
	const showSuccessNotification = (title: string, message: string) => {
		notifications.show({
			id: `success-${Date.now()}`,
			title,
			message,
			color: 'blue',
			icon: <IconTimeline />,
			autoClose: 3000,
			withCloseButton: true,
			position: 'bottom-right',
		});
	};

  	// Filter available columns function
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

  	// Update groups based on uploaded data and group column
	const setGroupCol = (value: string) => {
		_setGroupCol(value || "none");
		setGroup("All");
		if (value === "none" || !value) {
		setGroups(["All"]);
		} else if (uploadedData) {
		updateGroups(uploadedData, value);
		}
	};

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
            }).filter((value: any) => {
                if (value === undefined) return false;                
                if (value === "" || 
                    value === "null" || 
                    value === "undefined" || 
                    value === "NA" ||
                    value === "na" ||
                    value === "N/A" ||
                    value === "n/a") {
                    return false;
                }
                
                return true;
            });
            const uniqueValues = [...new Set(columnValues)];
            const groupOptions: string[] = ["All", ...uniqueValues.filter((g: string) => g !== "All")];
            setGroups(groupOptions);
        } catch (error) {
            console.error("Error updating groups:", error);
            setGroups(["All"]);
        }
    };

	// Save network visualization
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

	// Get the fixDeg value based on the selected option
	const getFixDegValue = () => {
		let fixDegValue = fixDeg;
		if (fixDeg === "student_column") {
		fixDegValue = student;
		} else if (fixDeg === "object1_column") {
		fixDegValue = object1;
		} else if (fixDeg === "object2_column") {
		if (object2 && object2 !== "none") {
			fixDegValue = `(${object1},${object2})`;
		} else {
			fixDegValue = object1; 
		}
		}
		return fixDegValue;
	};
	// Update HINA network
	const updateHinaNetwork = async () => {
		if (!uploadedData) return;
		const params = new URLSearchParams();
		const fixDegValue = getFixDegValue();

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
            setLoading(true);
            setNodeLevelLoading(true); 
            setDyadicLoading(true); 
            
            const res = await axios.post("/build-hina-network", params);
            setElements(res.data.elements);
            setCurrentNetworkView('hina');
            if (res.data.significant_edges) {
                setDyadicAnalysis(res.data.significant_edges);
                showSuccessNotification("Dyadic Analysis", `Identified ${res.data.significant_edges.length} significant edges in the network`);
            } else {
                setDyadicAnalysis(null);
            }
            fetchQuantityAndDiversity();
            showSuccessNotification("Network Updated", "HINA network has been successfully built");
            setLoading(false);
            setNodeLevelLoading(false); 
            setDyadicLoading(false);

            setTimeout(() => {
                if (cyRef.current) {
                cyRef.current.fit();
                const defaultZoom = cyRef.current.zoom() * 0.9;
                cyRef.current.zoom(defaultZoom);
                setZoom(cyRef.current.zoom());
                cyRef.current.center();
                }
            }, 10);
		} catch (error) {
            console.error("Error updating HINA network:", error);
            console.error("Error details:", error.response?.data || error.message)
            showAPIErrorNotification("Network Error", `Failed to build HINA network: ${error.response?.data?.detail || error.message}`);
            setLoading(false);
            setNodeLevelLoading(false); 
            setDyadicLoading(false);
            setClusterLoading(false);
		}
	};

	// Update Clustered network endpoint
	const updateClusteredNetwork = async () => {
		if (!uploadedData) return;
		const params = new URLSearchParams();
		const fixDegValue = getFixDegValue();

		params.append("data", uploadedData);
		params.append("group", group);
		params.append("student_col", student);  
		params.append("object1_col", object1);  
		params.append("object2_col", object2); 
		params.append("number_cluster", numberCluster);
		params.append("pruning", pruning);
		params.append("alpha", alpha.toString());
		params.append("fix_deg", fixDegValue);
		params.append("layout", layout);
		try {
            setLoading(true);
            setNodeLevelLoading(true);
            setDyadicLoading(true);
            setClusterLoading(true);
            const res = await axios.post("/build-cluster-network", params);
            originalElementsRef.current = [...res.data.elements];
            setElements(res.data.elements);
            setCurrentNetworkView('cluster');
		if (res.data.cluster_labels) {
			setClusterLabels(res.data.cluster_labels);
			const clusterCount = new Set(Object.values(res.data.cluster_labels)).size;
			showSuccessNotification("Mesoscale Clustering", `Identified ${clusterCount} clusters in the network`);
		} else {
			setClusterLabels(null);
		}
		// Handle significant edges from cluster result
		if (res.data.significant_edges) {
			setDyadicAnalysis(res.data.significant_edges);
			showSuccessNotification("Dyadic Analysis", `Identified ${res.data.significant_edges.length} significant edges in the network`);
		} else {
			setDyadicAnalysis(null);
		}
		if (res.data.compression_ratio !== undefined) {
			setCompressionRatio(res.data.compression_ratio);
			showSuccessNotification("Community Quality", `Compression ratio: ${res.data.compression_ratio.toFixed(4)}`);
		} else {
			setCompressionRatio(null);
		}
		fetchQuantityAndDiversity();
		showSuccessNotification("Network Updated", "Clustered network has been successfully built");
        setLoading(false);
        setNodeLevelLoading(false);
        setDyadicLoading(false);
        setClusterLoading(false);

		setTimeout(() => {
			if (cyRef.current) {
			cyRef.current.fit();
			const defaultZoom = cyRef.current.zoom() * 0.9;
			cyRef.current.zoom(defaultZoom);
			setZoom(cyRef.current.zoom());
			cyRef.current.center();
			}
		}, 10);
		} catch (error) {
            console.error("Error updating Clustered network:", error);
            showAPIErrorNotification("Network Error", `Failed to build clustered network: ${error.response?.data?.detail || error.message}`);
            setLoading(false);
            setNodeLevelLoading(false); 
            setDyadicLoading(false);
            setClusterLoading(false);
		}
	};

	// Update Object network endpoint
	const updateObjectNetwork = async () => {
		if (!uploadedData) return;
		
		try {
            setLoading(true);
            setNodeLevelLoading(true);
            setDyadicLoading(true);
            setClusterLoading(true);
            const params = new URLSearchParams();
            const fixDegValue = getFixDegValue();

            params.append("data", uploadedData);
            params.append("group", group);
            params.append("student_col", student);  
            params.append("object1_col", object1);  
            params.append("object2_col", object2); 
            params.append("number_cluster", numberCluster);
            params.append("pruning", pruning);
            params.append("alpha", alpha.toString());
            params.append("fix_deg", fixDegValue);
            params.append("layout", layout);
            const clusterResult = await axios.post("/build-cluster-network", params);

		// Update cluster data from response
		if (clusterResult.data.cluster_labels) {
			setClusterLabels(clusterResult.data.cluster_labels);
			const clusterCount = new Set(Object.values(clusterResult.data.cluster_labels)).size;
			showSuccessNotification("Mesoscale Clustering", `Identified ${clusterCount} clusters in the network`);
		} else {
			setClusterLabels(null);
		}
		
		// Update compression ratio from response
		if (clusterResult.data.compression_ratio !== undefined) {
			setCompressionRatio(clusterResult.data.compression_ratio);
			showSuccessNotification("Community Quality", `Compression ratio: ${clusterResult.data.compression_ratio.toFixed(4)}`);
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
			showSuccessNotification("Network Updated", "Tripartite network has been successfully built");
            setLoading(false);
            setNodeLevelLoading(false);
            setDyadicLoading(false);
            setClusterLoading(false);
		} else {
			console.warn("No object-object graphs found in the data");
			showAPIErrorNotification("Network Warning", "No object-object graphs were found in the cluster data");
		}
		} catch (error) {
            console.error("Error updating object network:", error);
            console.error("Error details:", error.response?.data || error.message);
            showAPIErrorNotification("Network Error", `Failed to build tripartite network: ${error.response?.data?.detail || error.message}`);
            setLoading(false);
            setNodeLevelLoading(false); 
            setDyadicLoading(false);
            setClusterLoading(false);
		}
	};

	// Fetch a selected Object Graph
    const fetchObjectGraph = async (params: URLSearchParams, savedSizes?: {
        student: number;
        object: number;
        object1: number;
        object2: number;
    }) => {
        try {
            const res = await axios.post("/build-object-network", params);
            if (res && res.data && res.data.elements) {
                setElements(res.data.elements);
                setCurrentNetworkView('object');
                const edges = res.data.elements.filter((el: any) => el.data.source);
                if (edges.length > 0) {
                    const significantEdges = edges.map((edge: any) => [
                        edge.data.source,
                        edge.data.target,
                        edge.data.weight || 1
                    ]);
                    setDyadicAnalysis(significantEdges);
                    showSuccessNotification("Dyadic Analysis", `Identified ${significantEdges.length} edges in the object-object graph`);
                } else {
                    setDyadicAnalysis([]);
                    showAPIErrorNotification("Analysis Warning", "No significant edges found in the object-object graph");
                    console.log("No significant edges found in the object graph");
                }
            } else {
                console.error("Invalid response structure:", res);
                showAPIErrorNotification("Response Error", "Invalid response structure from the server");
            }
            
            setTimeout(() => {
                if (cyRef.current) {
                    cyRef.current.fit();
                    const defaultZoom = cyRef.current.zoom() * 0.9;
                    cyRef.current.zoom(defaultZoom);
                    setZoom(cyRef.current.zoom());
                    cyRef.current.center();
                    
                    if (savedSizes) {
                        setStudentNodeSize(savedSizes.student);
                        setObjectNodeSize(savedSizes.object);
                        setObject1NodeSize(savedSizes.object1);
                        setObject2NodeSize(savedSizes.object2);
                    }
                    setTimeout(() => applyNodeSizes(), 0);
                }
            }, 50);
        } catch (error) {
            console.error("Error getting object graph:", error);
            console.error("Error details:", error.response?.data || error.message);
            showAPIErrorNotification("Graph Error", `Failed to build Tripartite network: ${error.response?.data?.detail || error.message}`);
        }
    };

	// Update the selected community ID and Object Graph
	const handleCommunityChange = (value: string) => {
        const currentSizes = {
            student: studentNodeSize,
            object: objectNodeSize,
            object1: object1NodeSize,
            object2: object2NodeSize
        };
		setSelectedCommunityId(value);    
            if (value && objectObjectGraphs && Object.keys(objectObjectGraphs).length > 0) {
            const objectParams = new URLSearchParams();
            const objectGraphsData = JSON.stringify(objectObjectGraphs);
            objectParams.append("data", objectGraphsData);
            objectParams.append("community_id", value); 
            objectParams.append("object1_col", object1);
            objectParams.append("object2_col", object2);
            objectParams.append("layout", layout);
            fetchObjectGraph(objectParams, currentSizes);
            setTimeout(() => {
                if (cyRef.current) {
                    applyNodeSizes();
                }
            }, 50);
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
		showSuccessNotification("Node-Level", "Quantity and diversity metrics calculated successfully");
		} catch (error) {
		console.error("Error computing Quantity & Diversity:", error);
		showAPIErrorNotification("Analysis Error", `Failed to compute quantity and diversity metrics: ${error.response?.data?.detail || error.message}`);
		}
	};

    // Update the graph when node sizes change
    useEffect(() => {
        if (cyRef.current) {
            applyNodeSizes();
        }
    }, [studentNodeSize, objectNodeSize, object1NodeSize, object2NodeSize, isObjectOnlyMode]);


    // When mode changes, sync the slider values
    useEffect(() => {
        if (isObjectOnlyMode && object1NodeSize === 20 && object2NodeSize === 20) {
            setObject1NodeSize(objectNodeSize);
            setObject2NodeSize(objectNodeSize);
        } else if (!isObjectOnlyMode && object1NodeSize !== object2NodeSize) {
            setObjectNodeSize(Math.round((object1NodeSize + object2NodeSize) / 2));
        }
    }, [isObjectOnlyMode]);

	// Zoom functions
	const zoomIn = () => {
		if (cyRef.current) {
		const currentZoom = cyRef.current.zoom();
		const newZoom = Math.min(currentZoom * 1.2, 3);
		cyRef.current.zoom(newZoom);
		setZoom(newZoom);
        setTimeout(() => applyNodeSizes(), 0);
		}
	};  

	const zoomOut = () => {
		if (cyRef.current) {
		const currentZoom = cyRef.current.zoom();
		const newZoom = Math.max(currentZoom / 1.2, 0.1);
		cyRef.current.zoom(newZoom);
		setZoom(newZoom);
        setTimeout(() => applyNodeSizes(), 0);
		}
	};

	const resetView = () => {
		if (cyRef.current) {
		cyRef.current.fit();
		cyRef.current.center();
		setZoom(cyRef.current.zoom());
		cyRef.current.elements().removeClass("highlight");
		setHighlightedNodeId(null);
        const defaultNodeSize = 20;
        setStudentNodeSize(defaultNodeSize);
        setObjectNodeSize(defaultNodeSize);
        setObject1NodeSize(defaultNodeSize);
        setObject2NodeSize(defaultNodeSize);
		}
	};

    // Label and weight switch handling 
    const setShowLabelsWithSize = (value: boolean) => {
        setShowLabels(value);
        setTimeout(() => applyNodeSizes(), 0);
    };

    const setShowEdgeWeightsWithSize = (value: boolean) => {
        setShowEdgeWeights(value);
        setTimeout(() => applyNodeSizes(), 0);
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
                setTimeout(() => {
                    if (cyRef.current) {
                        applyNodeSizes();
                    }
                }, 50);
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
            setTimeout(() => {
                if (cyRef.current) {
                    applyNodeSizes();
                }
            }, 50);
            return;
        }    
        const filteredStudentIds = Object.entries(clusterLabels || {})
            .filter(([node, label]) => String(label) === newValue)
            .map(([node]) => node);
    
        if (filteredStudentIds.length === 0) {
            setElements([...fullElements]);
            setTimeout(() => {
                if (cyRef.current) {
                    applyNodeSizes();
                }
            }, 50);
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
        setTimeout(() => {
            if (cyRef.current) {
                applyNodeSizes();
            }
        }, 50);
    };

	// Export to XLSX
	const exportToXLSX = () => {
		const wb = XLSX.utils.book_new();

		if (activeTab === "node-level") {
		if (!qdData) return;
		
		// Quantity
		const quantityData = [
			["Student", "Quantity"],
			...Object.entries(qdData.quantity).map(([key, value]) => [
			key, value
			]),
		];
		const wsQuantity = XLSX.utils.aoa_to_sheet(quantityData);
		XLSX.utils.book_append_sheet(wb, wsQuantity, "Quantity");

		// Diversity
		const diversityData = [
			["Student", "Diversity"],
			...Object.entries(qdData.diversity).map(([key, value]) => [
			key, value
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
			const edgesArray = Array.isArray(dyadicAnalysis) 
			? dyadicAnalysis 
			: (dyadicAnalysis.significant_edges || []);
			
			const sigData = [
			["Node 1", "Node 2", "Weight"],
			...edgesArray.map((edge) => [edge[0], edge[1], edge[2]]),
			];
			const wsSig = XLSX.utils.aoa_to_sheet(sigData);
			XLSX.utils.book_append_sheet(wb, wsSig, "Significant Edges");
			XLSX.writeFile(wb, "dyadic_analysis.xlsx");
		} else if (activeTab === "cluster") {
		if (!clusterLabels) return;
		const clusterData = [
			["Node", "Cluster Label"],
			...Object.entries(clusterLabels).map(([node, label]) => [
			node, label
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

	// Compute sorted data for tables
	const quantityTableData = useMemo(() => {
		if (!qdData?.quantity) return [];
		const data = Object.entries(qdData.quantity).map(([key, value]) => ({
		Student: key,
		Quantity: value
		}));
		return applySorting(data, quantitySortConfig, ["Quantity"]);
	}, [qdData?.quantity, quantitySortConfig]);

	const diversityTableData = useMemo(() => {
		if (!qdData?.diversity) return [];
		const data = Object.entries(qdData.diversity).map(([key, value]) => ({
		Student: key,
		Diversity: value
		}));
		return applySorting(data, diversitySortConfig, ["Diversity"]);
	}, [qdData?.diversity, diversitySortConfig]);

	const normalizedQuantityTableData = useMemo(() => {
		if (!qdData?.normalized_quantity) return [];
		const data = Object.entries(qdData.normalized_quantity).map(([key, value]) => ({
		Student: key,
		"Normalized Quantity": value
		}));
		return applySorting(data, normalizedQuantitySortConfig, ["Normalized Quantity"]);
	}, [qdData?.normalized_quantity, normalizedQuantitySortConfig]);
	
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
	
	const normalizedGroupTableData = useMemo(() => {
		if (!qdData?.normalized_quantity_by_group) return [];
		const data = Object.entries(qdData.normalized_quantity_by_group).map(([key, value]) => ({
		Student: key,
		"Normalized Quantity": value
		}));
		return applySorting(data, normalizedGroupSortConfig, ["Normalized Quantity"]);
	}, [qdData?.normalized_quantity_by_group, normalizedGroupSortConfig]);
	
	const dyadicSigTableData = useMemo(() => {
		if (!dyadicAnalysis) return [];
		const edgesArray = Array.isArray(dyadicAnalysis) 
		? dyadicAnalysis 
		: (dyadicAnalysis.significant_edges || []);
		const data = edgesArray.map((edge) => ({
		"Node 1": edge[0],
		"Node 2": edge[1],
		"Weight": edge[2],
		}));
		return applySorting(data, dyadicSigSortConfig, ["Weight"]);
	}, [dyadicAnalysis, dyadicSigSortConfig]);
	
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

	// Network node highlighting effect
	useEffect(() => {
		if (!cyRef.current) return;
		const cy = cyRef.current;
		
		const handleTap = (evt: any) => {
            const clickedNode = evt.target;
            const clickedNodeId = clickedNode.id();
            const currentSizes = {
                student: studentNodeSize,
                object: objectNodeSize,
                object1: object1NodeSize,
                object2: object2NodeSize
            };
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

                setTimeout(() => applyNodeSizes(), 0);
            }
		};
		
        const handleBackgroundTap = (evt: any) => {
            if (evt.target === cy) {
                cy.elements().removeClass("highlight");
                setHighlightedNodeId(null);
                setTimeout(() => applyNodeSizes(), 0);
            }
        };
        cy.on("tap", "node", handleTap);
        cy.on("tap", handleBackgroundTap);
        return () => {
            cy.removeListener("tap", "node", handleTap);
            cy.removeListener("tap", handleBackgroundTap);
        };
    }, [elements, highlightedNodeId, studentNodeSize, objectNodeSize, object1NodeSize, object2NodeSize]);


	// Node highlighting animation
	useEffect(() => {
		if (!cyRef.current || highlightedNodeId === null) return;
		const cy = cyRef.current;
		let opacity = 0.7;
		let increasing = true;
		let animationFrameId: number;
		const animate = () => {
		if (highlightedNodeId === null) return;
		if (opacity >= 0.98) increasing = false; 
		if (opacity <= 0.5) increasing = true;
		opacity += increasing ? 0.015 : -0.015;
		opacity = Math.min(0.99, Math.max(0.5, opacity));  
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
        if (elements.length > 0) {
            const nodeTypes = new Set<string>();
            let hasStudentNodes = false;
            let hasObject1Nodes = false;
            let hasObject2Nodes = false;
            let hasOtherNodes = false;
            
            elements.forEach(element => {
                if (element.group === 'nodes') {
                    const dataType = element.data?.type || '';
                    const classes = element.classes ? element.classes.toString() : '';
                    
                    if (dataType === 'student' || classes.includes('student')) {
                        hasStudentNodes = true;
                    } else if (dataType === 'object1' || classes.includes('object1')) {
                        hasObject1Nodes = true;
                    } else if (dataType === 'object2' || classes.includes('object2')) {
                        hasObject2Nodes = true;
                    } else if (dataType !== 'object1_object2' && !classes.includes('object1_object2')) {
                        hasOtherNodes = true;
                    }
                }
            });
            
            const shouldBeObjectOnlyMode = 
                (hasObject1Nodes && hasObject2Nodes && !hasStudentNodes && !hasOtherNodes) || 
                currentNetworkView === 'object';
            
            const networkViewChanged = prevNetworkView.current !== currentNetworkView;            
            prevNetworkView.current = currentNetworkView;
            setIsObjectOnlyMode(shouldBeObjectOnlyMode);
            
            // Reset node sizes:
            if (networkViewChanged || 
                originalElementsRef.current.length === 0 || 
                !nodeSizesInitialized.current) {

                const defaultNodeSize = 20;
                setStudentNodeSize(defaultNodeSize);
                setObjectNodeSize(defaultNodeSize);
                setObject1NodeSize(defaultNodeSize);
                setObject2NodeSize(defaultNodeSize);
                nodeSizesInitialized.current = true;
                if (cyRef.current) {
                    setTimeout(() => applyNodeSizes(), 50);
                }
            }
        }
    }, [elements, currentNetworkView]);
    
	// Update groups when groupCol or uploadedData changes
	useEffect(() => {
		if (uploadedData && groupCol !== "none") {
		updateGroups(uploadedData, groupCol);
		}
	}, [groupCol, uploadedData]);

	// Store original elements for filtering
	useEffect(() => {
		if (elements.length > 0) {
		setInitialRenderDone(false);
		if (originalElementsRef.current.length === 0) {
			originalElementsRef.current = [...elements];
		}
		}
	}, [elements]);

	// Reset fixDeg if required columns change
	useEffect(() => {
		if (!["none", student, object1, object2].includes(fixDeg)) {
		setFixDeg("none");
		}
	}, [student, object1, object2]);

	// Update cluster options when clusterLabels changes
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

    return {
        // Data and state
        selectedFileName,
        uploadedData,
        columns,
        elements,
        groups,
        group,
        student,
        object1,
        object2,
        attr,
        groupCol,
        numberCluster,
        pruning,
        alpha,
        fixDeg,
        layout,
        currentNetworkView,
        qdData,
        dyadicAnalysis,
        dyadicSigTableData,
        quantityTableData,
        diversityTableData,
        normalizedQuantityTableData,
        categoryQuantityTableData,
        normalizedGroupTableData,
        clusterTableData,
        clusterLabels,
        cluster,
        clusterOptions,
        compressionRatio,
        activeTab,
        showLabels,
        showEdgeWeights,
        zoom,
        selectedCommunityId,
        communityOptions,
        hasExportData,
        cyRef,
        highlightedNodeId,
        loading,
        nodeLevelLoading,
        dyadicLoading,
        clusterLoading,
        
        // Node size states
        studentNodeSize,
        objectNodeSize,
        object1NodeSize,
        object2NodeSize,
        isObjectOnlyMode,
        setStudentNodeSize,
        setObjectNodeSize,
        setObject1NodeSize,
        setObject2NodeSize,
        
        // Actions
        handleFileUpload,
        updateHinaNetwork,
        updateClusteredNetwork,
        updateObjectNetwork,
        handleGroupChange,
        handleClusterChange,
        handleCommunityChange,
        setStudent,
        setObject1,
        setObject2,
        setAttr,
        setGroupCol,
        setPruning,
        setAlpha,
        setFixDeg,
        setLayout,
        setNumberCluster,
        setActiveTab,
        setShowLabels: setShowLabelsWithSize,
        setShowEdgeWeights: setShowEdgeWeightsWithSize,
        setZoom,
        getAvailableColumns,
        toggleSort,
        LAYOUT_OPTIONS,
        PRUNING_OPTIONS,
        DEG_OPTIONS,
        handleSave,
        zoomIn,
        zoomOut,
        resetView,
        exportToXLSX,
    };
}