import React, { useState, useRef } from 'react';
import { Center, ActionIcon, Text, Stack, Box, Button } from '@mantine/core';
import { IconUpload, IconFile } from '@tabler/icons-react';
import classes from './CanvasBackgroud.module.css';

interface UploadOverlayProps {
  onUploadClick: (file: File) => void; // Updated to accept the file directly
}

const UploadOverlay: React.FC<UploadOverlayProps> = ({ onUploadClick }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  return (
    <Center
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <Stack align="center" spacing="md">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept=".csv,.xlsx,.xls"
        />

        <Box
          style={{
            pointerEvents: 'auto',
          }}
        >
          <ActionIcon
            className={classes.vibrateOnHover}
            variant="gradient"
            gradient={{ from: 'indigo', to: 'cyan', deg: 90 }}
            onClick={() => fileInputRef.current?.click()}
            size={150}
            radius="xl"
            aria-label="Select File"
          >
            <IconUpload size={50} />
          </ActionIcon>
        </Box>

        {selectedFile ? (
          <Stack spacing="xs" align="center" style={{ pointerEvents: 'auto' }}>
            <Text 
              fw={700}
              size="md"
              c="dimmed"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.7)',
                padding: '8px 16px',
                borderRadius: '4px'
              }}
            >
              <IconFile size={20} />
              {selectedFile.name}
            </Text>
            <Button
              variant="gradient"
              gradient={{ from: 'indigo', to: 'cyan' }}
              onClick={() => {
                if (selectedFile) onUploadClick(selectedFile);
              }}
              radius="xl"
              size="md"
            >
              Process File
            </Button>
          </Stack>
        ) : (
          <Text 
            fw={700} 
            size="lg" 
            c="indigo"
            style={{ 
              textShadow: '0 1px 2px rgba(255,255,255,0.7)',
              background: 'transparent',
              padding: '8px 16px',
              borderRadius: '4px'
            }}
          >
            Upload File to Start with HINA
          </Text>
        )}
      </Stack>
    </Center>
  );
};

export default UploadOverlay;