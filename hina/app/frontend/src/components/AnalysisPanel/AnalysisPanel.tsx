import React, { useState, useMemo } from "react";
import {
  Paper,
  Title,
  Table,
  Tabs,
  Text,
  Button,
  ScrollArea,
  Accordion,
  Group,
  Badge,
  Loader,
} from "@mantine/core";
import { IconDownload, IconSortAscending, IconSortDescending, IconArrowsSort } from "@tabler/icons-react";

interface AnalysisPanelProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  qdData: any | null;
  dyadicAnalysis: any[] | null;
  clusterLabels: Record<string, string> | null;
  compressionRatio: number | null;
  exportToXLSX: () => void;
  nodeLevelLoading?: boolean;
  dyadicLoading?: boolean;
  clusterLoading?: boolean;
}

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  activeTab,
  setActiveTab,
  qdData,
  dyadicAnalysis,
  clusterLabels,
  compressionRatio,
  exportToXLSX,
  nodeLevelLoading,
  dyadicLoading,
  clusterLoading,
}) => {
  // Sort configurations for various tables
  const [quantitySortConfig, setQuantitySortConfig] = useState<SortConfig>(null);
  const [diversitySortConfig, setDiversitySortConfig] = useState<SortConfig>(null);
  const [normalizedQuantitySortConfig, setNormalizedQuantitySortConfig] = useState<SortConfig>(null);
  const [categoryQuantitySortConfig, setCategoryQuantitySortConfig] = useState<SortConfig>(null);
  const [normalizedGroupSortConfig, setNormalizedGroupSortConfig] = useState<SortConfig>(null);
  const [dyadicSigSortConfig, setDyadicSigSortConfig] = useState<SortConfig>(null);
  const [clusterSortConfig, setClusterSortConfig] = useState<SortConfig>(null);

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
      Object.entries(categories as Record<string, number>).forEach(([category, value]) => {
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
    const edgesArray = Array.isArray(dyadicAnalysis) 
      ? dyadicAnalysis 
      : (dyadicAnalysis.significant_edges || []);
    const data = edgesArray.map((edge) => ({
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


  return (
    <ScrollArea h={700}>
      <Paper withBorder shadow="sm">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab 
                value="node-level"
            >
                <Group gap="xs" wrap="nowrap">
                    <span>Node-Level</span>
                    {nodeLevelLoading && <Loader size="xs" color="indigo" />}
                    {!nodeLevelLoading && qdData && <Badge size="xs" variant="light" color="green">Ready</Badge>}
                </Group>
            </Tabs.Tab>
            <Tabs.Tab 
                value="dyadic"
            >
                <Group gap="xs" wrap="nowrap">
                    <span>Dyadic Analysis</span>
                    {dyadicLoading && <Loader size="xs" color="indigo" />}
                    {!dyadicLoading && dyadicAnalysis && <Badge size="xs" variant="light" color="green">Ready</Badge>}
                </Group>
            </Tabs.Tab>
            <Tabs.Tab 
                value="cluster"
            >
                <Group gap="xs" wrap="nowrap">
                    <span>Mesoscale Clustering</span>
                    {clusterLoading && <Loader size="xs" color="indigo" />}
                    {!clusterLoading && clusterLabels && <Badge size="xs" variant="light" color="green">Ready</Badge>}
                </Group>
            </Tabs.Tab>
          </Tabs.List>

          {/* Node-Level Tab Content */}
          <Tabs.Panel value="node-level">
              {nodeLevelLoading ? (
                <Group py="xl" justify="center">
                    <Loader size="lg" color="indigo" />
                    <Text>Loading node-level metrics...</Text>
                </Group>
              ) : activeTab === "node-level" && qdData ? (
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
              ) : (
                <Text p="md">No Node-Level data available. Run HINA to get metrics.</Text>
              )}
          </Tabs.Panel>

          {/* Dyadic Analysis Tab Content */}
          <Tabs.Panel value="dyadic">
              {dyadicLoading ? (
                <Group py="xl" justify="center">
                    <Loader size="lg" color="indigo" />
                    <Text>Loading dyadic analysis...</Text>
                </Group>
              ) : dyadicAnalysis ? (
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
              {clusterLoading ? (
                <Group py="xl" justify="center">
                    <Loader size="lg" color="indigo" />
                    <Text>Loading clustering results...</Text>
                </Group>
              ) : clusterLabels ? (
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
  );
};