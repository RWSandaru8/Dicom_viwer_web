import React, { useState, useRef } from 'react';
import { Upload, X, Calendar, Clock, FileText, Image } from 'lucide-react';

interface AddStudyModalContentProps {
  hide: () => void;
}

const AddStudyModalContent: React.FC<AddStudyModalContentProps> = ({ hide }) => {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [modality, setModality] = useState('');
  const [serverType, setServerType] = useState('');
  const [accessionNumber, setAccessionNumber] = useState('');
  const [description, setDescription] = useState('');
  const [studyDate, setStudyDate] = useState('');
  const [studyTime, setStudyTime] = useState('');
  const [dicomFileUrl, setDicomFileUrl] = useState('');
  const [reportFileUrl, setReportFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dicomFileName, setDicomFileName] = useState('');
  const [reportFileName, setReportFileName] = useState('');

  const dicomFileInputRef = useRef<HTMLInputElement>(null);
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const [dicomFile, setDicomFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);

  const handleDicomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDicomFileName(file.name);
      setDicomFile(file);
      setDicomFileUrl('');
    }
  };

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReportFileName(file.name);
      setReportFile(file);
      setReportFileUrl('');
    }
  };

  const handleUploadStudy = async () => {
    try {
      if (!patientId || !patientName || !modality) {
        setError('Patient ID, Patient Name, and Modality are required fields.');
        return;
      }

      setIsSubmitting(true);
      setError('');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Study uploaded successfully');
      hide();
    } catch (err) {
      console.error('Error adding study:', err);
      setError('Failed to add study. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Study</h2>
          <button
            onClick={hide}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Patient Information Section */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter patient ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter patient name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Study Details Section */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modality <span className="text-red-500">*</span>
                </label>
                <select
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  required
                >
                  <option value="">Select Modality</option>
                  <option value="CT">CT</option>
                  <option value="MRI">MR</option>
                  <option value="DX">DX</option>
                  <option value="CR">CR</option>
                  <option value="US">US</option>
                  <option value="XA">XA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Server Type</label>
                <select
                  value={serverType}
                  onChange={(e) => setServerType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">Select Server Type</option>
                  <option value="DICOMweb">DICOMweb</option>
                  <option value="DIMSE">DIMSE</option>
                  <option value="WADO">WADO</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accession Number</label>
                <input
                  type="text"
                  value={accessionNumber}
                  onChange={(e) => setAccessionNumber(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter accession number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Study Date
                </label>
                <input
                  type="date"
                  value={studyDate}
                  onChange={(e) => setStudyDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Study Time
                </label>
                <input
                  type="time"
                  value={studyTime}
                  onChange={(e) => setStudyTime(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Enter study description..."
            />
          </div>

          {/* File Upload Sections */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">DICOM Files</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
              onClick={() => dicomFileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={dicomFileInputRef}
                className="hidden"
                accept=".dcm,.zip"
                onChange={handleDicomFileChange}
              />
              <div className="flex flex-col items-center">
                {dicomFileName ? (
                  <>
                    <Image className="w-12 h-12 text-green-500 mb-3" />
                    <p className="text-sm font-medium text-green-600 mb-1">{dicomFileName}</p>
                    <p className="text-xs text-gray-500">Click to change file</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                    </div>
                    <p className="text-base font-medium text-blue-600 mb-1">Upload a file</p>
                    <p className="text-sm text-gray-500 mb-1">or drag and drop</p>
                    <p className="text-xs text-gray-400">DICOM files (.dcm) or ZIP archives up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Report Files</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
              onClick={() => reportFileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={reportFileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleReportFileChange}
              />
              <div className="flex flex-col items-center">
                {reportFileName ? (
                  <>
                    <FileText className="w-12 h-12 text-green-500 mb-3" />
                    <p className="text-sm font-medium text-green-600 mb-1">{reportFileName}</p>
                    <p className="text-xs text-gray-500">Click to change file</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                    </div>
                    <p className="text-base font-medium text-blue-600 mb-1">Upload a file</p>
                    <p className="text-sm text-gray-500 mb-1">or drag and drop</p>
                    <p className="text-xs text-gray-400">PDF, DOC, DOCX files up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={hide}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadStudy}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                'Upload Study'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudyModalContent;
