import React, { useState, useRef } from 'react';
import { Center, ActionIcon, Text, Stack, Box, Button } from '@mantine/core';
import { IconUpload, IconFile } from '@tabler/icons-react';
import classes from './CanvasBackgroud.module.css';

interface UploadOverlayProps {
  onUploadClick: (file: File) => void;
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
    <Center className={classes.uploadOverlayContainer}>
      <Stack align="center" gap="md">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept=".csv,.xlsx"
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
          <Stack align="center" style={{ pointerEvents: 'auto' }}>
            <Text 
              fw={700}
              size="md"
              c="dimmed"
              className={classes.fileNameText}
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
            className={classes.uploadPromptText}
          >
            Upload File to Start with HINA
          </Text>
        )}
      </Stack>
    </Center>
  );
};

export default UploadOverlay;