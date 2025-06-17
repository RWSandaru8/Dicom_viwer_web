import React from 'react';
import { useTranslation } from 'react-i18next';
import { LegacyButton, InputText, Select } from '../../../../platform/ui/src/components';
import Typography from '../../../../platform/ui/src/components/Typography';

interface AddStudyModalContentProps {
  hide: () => void;
}

const AddStudyModalContent: React.FC<AddStudyModalContentProps> = ({ hide }) => {
  const { t } = useTranslation('AddStudyModal');

  const [patientId, setPatientId] = React.useState('');
  const [patientName, setPatientName] = React.useState('');
  const [modality, setModality] = React.useState('');
  const [serverType, setServerType] = React.useState('');
  const [accessionNumber, setAccessionNumber] = React.useState('');
  const [description, setDescription] = React.useState('');

  const handleUploadStudy = () => {
    console.log('Upload Study clicked', {
      patientId,
      patientName,
      modality,
      serverType,
      accessionNumber,
      description,
    });
    hide();
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-lg font-semibold text-gray-800">{t('Add New Study')}</h2>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputText
          id="patient-id"
          label={t('Patient ID')}
          value={patientId}
          onChange={value => setPatientId(value)}
          className="text-sm"
        />
        <InputText
          id="patient-name"
          label={t('Patient Name')}
          value={patientName}
          onChange={value => setPatientName(value)}
          className="text-sm"
        />
        <Select
          id="modality"
          options={[
            { value: 'CT', label: 'CT' },
            { value: 'MR', label: 'MR' },
          ]}
          value={modality}
          onChange={value => setModality(value)}
          placeholder={t('Select Modality')}
          className="text-sm"
        />
        <Select
          id="server-type"
          options={[{ value: 'DICOMweb', label: 'DICOMweb' }]}
          value={serverType}
          onChange={value => setServerType(value)}
          placeholder={t('Select Server Type')}
          className="text-sm"
        />
        <InputText
          id="accession-number"
          label={t('Accession Number')}
          value={accessionNumber}
          onChange={value => setAccessionNumber(value)}
          className="text-sm"
        />
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

      <div className="mb-4 rounded border-2 border-dashed border-gray-300 p-6 text-center">
        <p className="mb-1 text-base font-medium text-gray-800">{t('DICOM Files')}</p>
        <p className="text-sm text-gray-500">{t('Upload a file or drag and drop')}</p>
        <p className="text-xs text-gray-400">{t('PDF, DOC, DOCX files up to 10MB')}</p>
      </div>

      <div className="mb-6 rounded border-2 border-dashed border-gray-300 p-6 text-center">
        <p className="mb-1 text-base font-medium text-gray-800">{t('Report Files')}</p>
        <p className="text-sm text-gray-500">{t('Upload a file or drag and drop')}</p>
        <p className="text-xs text-gray-400">
          {t('DICOM files (.dcm) or ZIP archives up to 10MB')}
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <LegacyButton
          onClick={hide}
          variant="outlined"
          className="border-gray-300 text-gray-700"
        >
          {t('Cancel')}
        </LegacyButton>
        <LegacyButton
          onClick={handleUploadStudy}
          variant="contained"
          className="bg-emerald-500 text-white hover:bg-emerald-600"
        >
          {t('Upload Study')}
        </LegacyButton>
      </div>
    </div>
  );
};

export default AddStudyModalContent;
