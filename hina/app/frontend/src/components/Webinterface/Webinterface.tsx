import React from "react";
import { AppShell, Container, Paper, Grid } from "@mantine/core";
import { DataInputPanel } from "../DataInputPanel/DataInputPanel";
import { NetworkVisualization } from "../NetworkVisualization/NetworkVisualization";
import { AnalysisPanel } from "../AnalysisPanel/AnalysisPanel";
import { useNetworkData } from "./hooks/useNetworkData";
import { NavbarMinimalColored } from './Navbar/NavbarMinimalColored';
import UploadOverlay from "../CanvasBackground/UploadOverlay";
import NetworkBackground from "../CanvasBackground/NetworkBackground"; 

export function Webinterface() {
  const {
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
    selectedCommunityId,
    communityOptions,
    qdData,
    dyadicAnalysis,
    clusterLabels,
    cluster,
    clusterOptions,
    compressionRatio,
    activeTab,
    showLabels,
    showEdgeWeights,
    zoom,
    cyRef,
    highlightedNodeId,
    
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
    setShowLabels,
    setShowEdgeWeights,
    setZoom,
    getAvailableColumns,
    handleSave,
    zoomIn,
    zoomOut,
    resetView,
    exportToXLSX,
  } = useNetworkData();

  const handleUploadClick = (file: File) => {
    handleFileUpload(file);
  };

  return (
    <AppShell padding="md">
      <NetworkBackground /> 
      {!uploadedData ? (
        <UploadOverlay onUploadClick={handleUploadClick} />
      ) : (
        <AppShell.Main>
          <Container fluid style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Paper withBorder shadow="sm" p="md" mb="md" style={{ width: "100%" }}>
              <DataInputPanel
                selectedFileName={selectedFileName}
                columns={columns}
                student={student}
                object1={object1}
                object2={object2}
                attr={attr}
                groupCol={groupCol}
                numberCluster={numberCluster}
                pruning={pruning}
                alpha={alpha}
                fixDeg={fixDeg}
                layout={layout}
                handleFileUpload={handleFileUpload}
                setStudent={setStudent}
                setObject1={setObject1}
                setObject2={setObject2}
                setAttr={setAttr}
                setGroupCol={setGroupCol}
                setPruning={setPruning}
                setAlpha={setAlpha}
                setFixDeg={setFixDeg}
                setLayout={setLayout}
                setNumberCluster={setNumberCluster}
                updateHinaNetwork={updateHinaNetwork}
                updateClusteredNetwork={updateClusteredNetwork}
                updateObjectNetwork={updateObjectNetwork}
                getAvailableColumns={getAvailableColumns}
              />
              
              <Grid>
                <Grid.Col span={8}>
                  <NetworkVisualization
                    elements={elements}
                    currentNetworkView={currentNetworkView}
                    groups={groups}
                    group={group}
                    groupCol={groupCol} 
                    handleGroupChange={handleGroupChange}
                    clusterLabels={clusterLabels}
                    cluster={cluster}
                    clusterOptions={clusterOptions}
                    handleClusterChange={handleClusterChange}
                    communityOptions={communityOptions}
                    selectedCommunityId={selectedCommunityId}
                    handleCommunityChange={handleCommunityChange}
                    showLabels={showLabels}
                    showEdgeWeights={showEdgeWeights}
                    setShowLabels={setShowLabels}
                    setShowEdgeWeights={setShowEdgeWeights}
                    handleSave={handleSave}
                    zoomIn={zoomIn}
                    zoomOut={zoomOut}
                    resetView={resetView}
                    setZoom={setZoom}
                    cyRef={cyRef}
                    highlightedNodeId={highlightedNodeId}
                  />
                </Grid.Col>
                
                <Grid.Col span={4}>
                  <AnalysisPanel
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    qdData={qdData}
                    dyadicAnalysis={dyadicAnalysis}
                    clusterLabels={clusterLabels}
                    compressionRatio={compressionRatio}
                    exportToXLSX={exportToXLSX}
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          </Container>
        </AppShell.Main>
      )}
    </AppShell>
  );
}