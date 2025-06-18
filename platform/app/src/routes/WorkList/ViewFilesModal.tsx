import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ViewFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  study: {
    ID: string;
    Name?: string;
    dicomFileUrl?: string;
    reportFileUrl?: string;
    dicom_file_url?: string;
    report_file_url?: string;
  } | null;
}

const ViewFilesModal: React.FC<ViewFilesModalProps> = ({ isOpen, onClose, study }) => {
  const navigate = useNavigate();

  if (!isOpen || !study) {
    return null;
  }

  // Extract URLs from the study object considering both possible property names
  const dicomFileUrl = study.dicomFileUrl || study.dicom_file_url || '';
  const reportFileUrl = study.reportFileUrl || study.report_file_url || '';
  const studyName = study.Name || `Study ${study.ID}`;

  const handleViewInViewer = () => {
    if (dicomFileUrl) {
      // Navigate to the DICOM viewer with this study ID
      navigate(`/localbasic?StudyInstanceUIDs=${study.ID}`);
      onClose();
    }
  };

  const handleDownloadDicom = () => {
    if (dicomFileUrl) {
      // Open the file URL directly in a new tab for download
      window.open(dicomFileUrl, '_blank');
    }
  };

  const handleReportClick = () => {
    if (reportFileUrl) {
      window.open(reportFileUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{studyName}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        
        <div className="mb-4">
          <h3 className="font-semibold mb-2">DICOM File</h3>
          <div className="flex gap-2">
            <button
              onClick={handleViewInViewer}
              disabled={!dicomFileUrl}
              className={`flex-1 p-2 rounded-md ${
                dicomFileUrl ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              View in OHIF Viewer
            </button>
            <button
              onClick={handleDownloadDicom}
              disabled={!dicomFileUrl}
              className={`flex-1 p-2 rounded-md ${
                dicomFileUrl ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              Download File
            </button>
          </div>
        </div>
        
        {reportFileUrl && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Report</h3>
            <button
              onClick={handleReportClick}
              className="w-full p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md"
            >
              Open Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewFilesModal;
