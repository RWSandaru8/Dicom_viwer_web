import React from 'react';
import ToolButtonListWrapper from './ToolButtonListWrapper';

interface FloatingToolGroupBarProps {
  buttonSection: string | null;
  onClose: () => void;
}

const FloatingToolGroupBar: React.FC<FloatingToolGroupBarProps> = ({ buttonSection, onClose }) => {
  if (!buttonSection) {
    return null;
  }
  return (
    <div className="pointer-events-auto absolute top-0 left-1/2 z-[100] mt-2 flex w-auto -translate-x-1/2 transform justify-center rounded-full bg-[#00A693]/10 py-2 shadow-md">
      <ToolButtonListWrapper
        buttonSection={buttonSection}
        id={buttonSection + 'Floating'}
        horizontalInHeader={true}
        onInteraction={onClose}
      />
    </div>
  );
};

export default FloatingToolGroupBar;
