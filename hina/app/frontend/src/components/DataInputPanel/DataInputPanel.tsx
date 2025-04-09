import React, { useState } from "react";
import {
  FileInput,
  Select,
  NumberInput,
  Button,
  Group,
  Title,
  Paper,
} from "@mantine/core";
import { IconRefresh, IconUpload, IconFile } from "@tabler/icons-react";

interface DataInputPanelProps {
  selectedFileName: string | null;
  columns: string[];
  student: string;
  object1: string;
  object2: string;
  attr: string;
  groupCol: string;
  numberCluster: string;
  pruning: string;
  alpha: number;
  fixDeg: string;
  layout: string;
  handleFileUpload: (file: File | null) => void;
  setStudent: (value: string) => void;
  setObject1: (value: string) => void;
  setObject2: (value: string) => void;
  setAttr: (value: string) => void;
  setGroupCol: (value: string) => void;
  setPruning: (value: string) => void;
  setAlpha: (value: number) => void;
  setFixDeg: (value: string) => void;
  setLayout: (value: string) => void;
  setNumberCluster: (value: string) => void;
  updateHinaNetwork: () => void;
  updateClusteredNetwork: () => void;
  updateObjectNetwork: () => void;
  getAvailableColumns: (currentField: string) => string[];
}

export const DataInputPanel: React.FC<DataInputPanelProps> = ({
  selectedFileName,
  columns,
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
  handleFileUpload,
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
  updateHinaNetwork,
  updateClusteredNetwork,
  updateObjectNetwork,
  getAvailableColumns,
}) => {

  // Custom file input handler
  const handleFileChange = (file: File | null) => {
    handleFileUpload(file);
  };

  // Layout options for dropdown
  const LAYOUT_OPTIONS = [
    { value: "spring", label: "Spring" },
    { value: "bipartite", label: "Bipartite" },
    { value: "circular", label: "Circular" },
  ];

  // Pruning options for dropdown
  const PRUNING_OPTIONS = [
    { value: "none", label: "No Pruning" },
    { value: "custom", label: "Custom Pruning" },
  ];

  // Dynamic fixDeg options based on current columns
  const DEG_OPTIONS = React.useMemo(() => {
    const options = [
      { value: "none", label: "None" }
    ];
    
    if (student) {
      options.push({ value: "student_column", label: `Student: ${student}` });
    }
    
    if (object1 && object2 == "none") {
      options.push({ value: "object1_column", label: `Object 1: ${object1}` });
    }
    
    if (object2 && object2 !== "none") {
      options.push({ value: "object2_column", label: `Object 1: ${object1}, Object 2: ${object2}` });
    }
    return options;
  }, [student, object1, object2]);

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

  return (
    <>
      <FileInput
        label="Upload File"
        placeholder={selectedFileName || "Select CSV/XLSX file"}
        accept=".csv,.xlsx"
        onChange={handleFileChange}
        mb="md"
        leftSection={<IconFile size={16} />}
        value={null}
        clearable={false}
      />
      
      {columns.length > 0 && (
        <Paper withBorder shadow="sm" p="md" mb="md">
          {/* DATA INPUTS SECTION */}
          <SectionHeader>Data Inputs</SectionHeader>
          <Group grow>
            <Select
              label="Student Column"
              withAsterisk
			  value={student === "none" ? null : student}
			  onChange={(value) => setStudent(value || "none")}
			  data={[{value: "none", label: ""}].concat(
				Array.from(new Set([...getAvailableColumns('student'), ...(student !== "none" ? [student] : [])]))
				.map(col => ({value: col, label: col}))
				)}
			  clearable={false}	
            />
            <Select
              label="Object 1 Column"
              withAsterisk
			  value={object1 === "none" ? null : object1}
			  onChange={(value) => setObject1(value || "none")}
			  data={[{value: "none", label: ""}].concat(
				Array.from(new Set([...getAvailableColumns('object1'), ...(object1 !== "none" ? [object1] : [])]))
				.map(col => ({value: col, label: col}))
				)}
			  clearable={false}
            />
            <Select
              label="Object 2 Column (For Tripartite)"
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
              value={attr}
              onChange={(value) => setAttr(value || "none")}
              data={[{value: "none", label: "None"}].concat(
                Array.from(new Set([...getAvailableColumns('attr'), ...(attr && attr !== "none" ? [attr] : [])]))
                .map(col => ({value: col, label: col}))
              )}
            />
            <Select
              label="Group Column (Optional)"
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
				key={`cluster-input-${selectedFileName || 'none'}`}
				label="Fixed Number of Cluster (Optional)"
				placeholder="None"
				value={numberCluster === "" ? undefined : Number(numberCluster)}
				onChange={(val) => setNumberCluster(val?.toString() || "")}
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
    </>
  );
}