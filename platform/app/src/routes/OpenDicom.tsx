import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MODULE_TYPES } from '@ohif/core';

import filesToStudies from './Local/filesToStudies';
import { extensionManager } from '../App';

/**
 * Route component that downloads a remote DICOM file, registers it to the
 * local datasource, then forwards the user to the standard OHIF viewer route.
 *
 * Expected URL: /viewer/open?dicomUrl=<encoded-remote-url>
 */
const OpenDicom: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(search);
      const dicomUrl = params.get('dicomUrl');
      if (!dicomUrl) return;

      try {
        // 1. Download remote file
        const response = await fetch(dicomUrl);
        if (!response.ok) throw new Error('Failed to fetch DICOM file');
        const blob = await response.blob();
        const filename = dicomUrl.split('/').pop() || `${Date.now()}.dcm`;
        const file = new File([blob], filename, {
          type: blob.type || 'application/dicom',
        });

        // 2. Obtain the first localApi datasource
        const localDataSourceEntry = extensionManager
          .modules[MODULE_TYPES.DATA_SOURCE]
          .flatMap(mod => mod.module)
          .find(mod => mod.type === 'localApi');

        if (!localDataSourceEntry) {
          throw new Error('Local datasource not found');
        }

        const localDataSource = localDataSourceEntry.createDataSource({});

        // 3. Register the file → StudyInstanceUID(s)
        const studyUIDs = await filesToStudies([file], localDataSource);

        // 4. Build standard route & navigate
        const qs = new URLSearchParams();
        studyUIDs.forEach(uid => qs.append('StudyInstanceUIDs', uid));
        qs.append('datasources', 'dicomlocal');
        navigate(`/viewer/dicomlocal?${qs.toString()}`, { replace: true });
      } catch (err) {
        console.error('Error loading remote DICOM', err);
      }
    })();
  }, [search, navigate]);

  return (
    <div className="flex h-full w-full items-center justify-center text-white">
      Loading DICOM study…
    </div>
  );
};

export default OpenDicom;
