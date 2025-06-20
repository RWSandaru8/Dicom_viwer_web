import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LegacyButton, InputText, Select } from '../../../../platform/ui/src/components';
import Typography from '../../../../platform/ui/src/components/Typography';
import axios from 'axios';
import moment from 'moment';

interface AddStudyModalContentProps {
  hide: () => void;
}

const AddStudyModalContent: React.FC<AddStudyModalContentProps> = ({ hide }) => {
  const { t } = useTranslation('AddStudyModal');

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

  // Store the actual file objects for upload
  const [dicomFile, setDicomFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);

  const handleDicomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDicomFileName(file.name);
      setDicomFile(file);
      // We'll set a temporary URL for display purposes
      setDicomFileUrl('');
    }
  };

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReportFileName(file.name);
      setReportFile(file);
      // We'll set a temporary URL for display purposes
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
      
      // Use the selected date and time or default to current date/time
      const date = studyDate ? studyDate.replace(/-/g, '') : moment().format('YYYYMMDD');
      const time = studyTime ? studyTime.replace(/:/g, '') : moment().format('HHmmss');
      
      // Create FormData to handle file uploads
      const formData = new FormData();
      
      // Add study metadata
      formData.append('id', patientId);
      formData.append('name', patientName);
      formData.append('accession', accessionNumber || '');
      formData.append('modularity', modality);
      formData.append('description', description || '');
      formData.append('date', date);
      formData.append('time', time);
      
      // Add files if available
      if (dicomFile) {
        formData.append('dicomFile', dicomFile);
      } else if (dicomFileUrl) {
        formData.append('dicom_file_url', dicomFileUrl);
      }
      
      if (reportFile) {
        formData.append('reportFile', reportFile);
      } else if (reportFileUrl) {
        formData.append('report_file_url', reportFileUrl);
      }
      
      console.log('Uploading study with files...');
      
      // Send the data to the backend
      const response = await axios.post('http://localhost:5000/api/studies', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Study added successfully:', response.data);
      hide();
    } catch (err) {
      console.error('Error adding study:', err);
      setError('Failed to add study. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-lg font-semibold text-gray-800">{t('Add New Study')}</h2>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputText
          id="patient-id"
          label={t('Patient ID') + ' *'}
          value={patientId}
          onChange={value => setPatientId(value)}
          className="text-sm"
          required
        />
        <InputText
          id="patient-name"
          label={t('Patient Name') + ' *'}
          value={patientName}
          onChange={value => setPatientName(value)}
          className="text-sm"
          required
        />
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-gray-900">Modality *</label>
          <select 
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none" 
            value={modality} 
            onChange={(e) => setModality(e.target.value)}
            required
          >
            <option value="">Select Modality</option>
            <option value="CT">CT</option>
            <option value="MR">MR</option>
            <option value="DX">DX</option>
            <option value="CR">CR</option>
            <option value="US">US</option>
            <option value="XA">XA</option>
          </select>
        </div>
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-gray-900">Server Type</label>
          <select 
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none" 
            value={serverType} 
            onChange={(e) => setServerType(e.target.value)}
          >
            <option value="">Select Server Type</option>
            <option value="DICOMweb">DICOMweb</option>
            <option value="DIMSE">DIMSE</option>
            <option value="WADO">WADO</option>
          </select>
        </div>
        <InputText
          id="accession-number"
          label={t('Accession Number')}
          value={accessionNumber}
          onChange={value => setAccessionNumber(value)}
          className="text-sm"
        />
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-gray-900">Study Date</label>
          <input 
            type="date" 
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            value={studyDate}
            onChange={(e) => setStudyDate(e.target.value)}
          />
        </div>
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-gray-900">Study Time</label>
          <input 
            type="time" 
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            value={studyTime}
            onChange={(e) => setStudyTime(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4">
        <InputText
          id="description"
          label={t('Description')}
          value={description}
          onChange={value => setDescription(value)}
          className="text-sm"
        />
      </div>

      <div className="mb-4 cursor-pointer rounded border-2 border-dashed border-gray-300 p-6 text-center" onClick={() => dicomFileInputRef.current?.click()}>
        <input 
          type="file" 
          ref={dicomFileInputRef}
          className="hidden" 
          accept=".dcm,.zip"
          onChange={handleDicomFileChange}
        />
        <p className="mb-1 text-base font-medium text-gray-800">{t('DICOM Files')}</p>
        {dicomFileName ? (
          <p className="text-sm text-green-600">{dicomFileName}</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">{t('Click to upload a DICOM file')}</p>
            <p className="text-xs text-gray-400">{t('DICOM files (.dcm) or ZIP archives up to 10MB')}</p>
          </>
        )}
      </div>

      <div className="mb-6 cursor-pointer rounded border-2 border-dashed border-gray-300 p-6 text-center" onClick={() => reportFileInputRef.current?.click()}>
        <input 
          type="file" 
          ref={reportFileInputRef}
          className="hidden" 
          accept=".pdf,.doc,.docx"
          onChange={handleReportFileChange}
        />
        <p className="mb-1 text-base font-medium text-gray-800">{t('Report Files')}</p>
        {reportFileName ? (
          <p className="text-sm text-green-600">{reportFileName}</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">{t('Click to upload a report file')}</p>
            <p className="text-xs text-gray-400">{t('PDF, DOC, DOCX files up to 10MB')}</p>
          </>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <LegacyButton
          onClick={hide}
          variant="outlined"
          className="border-gray-300 text-gray-700"
          disabled={isSubmitting}
        >
          {t('Cancel')}
        </LegacyButton>
        <LegacyButton
          onClick={handleUploadStudy}
          variant="contained"
          className="bg-emerald-500 text-white hover:bg-emerald-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('Uploading...') : t('Upload Study')}
        </LegacyButton>
      </div>
    </div>
  );
};

export default AddStudyModalContent;
