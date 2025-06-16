import React from 'react';
import { Button } from '@ohif/ui-next';

interface ModalityButtonsProps {
  modalities: string[];
  selectedModality: string;
  onModalityChange: (modality: string) => void;
}

export const ModalityButtons: React.FC<ModalityButtonsProps> = ({
  modalities,
  selectedModality,
  onModalityChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      {modalities.map(modality => (
        <Button
          key={modality}
          variant="secondary"
          size="sm"
          className={selectedModality === modality ? 'bg-primary-main text-black' : ''}
          onClick={() => onModalityChange(modality)}
        >
          {modality}
        </Button>
      ))}
    </div>
  );
};
