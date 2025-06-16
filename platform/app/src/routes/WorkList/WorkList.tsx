import React, { useState, useEffect, useMemo } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import qs from 'query-string';
import isEqual from 'lodash.isequal';
import { useTranslation } from 'react-i18next';
import { Types } from '@ohif/core';
import { Calendar as CalendarIcon } from 'lucide-react';

import filtersMeta from './filtersMeta.js';
import { useAppConfig } from '@state';
import { useDebounce, useSearchParams } from '../../hooks';
import { utils } from '@ohif/core';
import { FolderKanban, Clock4, CalendarDays } from 'lucide-react';

import {
  StudyListExpandedRow,
  EmptyStudies,
  StudyListTable,
  StudyListPagination,
  StudyListFilter,
  Button,
  ButtonEnums,
  PatientInfoVisibility,
} from '@ohif/ui';

import {
  Header,
  Icons,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Clipboard,
  useModal,
  useSessionStorage,
  Onboarding,
  ScrollArea,
  InvestigationalUseDialog,
  Card,
  InputFilter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@ohif/ui-next';

import { ModalityButtons } from '../../components/ModalityButtons';
import { CustomIcons } from '../../components/CustomIcons';

import { preserveQueryParameters, preserveQueryStrings } from '../../utils/preserveQueryParameters';

const { sortBySeriesDate } = utils;

const seriesInStudiesMap = new Map();

interface FilterValues {
  patientName: string;
  mrn: string;
  studyDate: {
    startDate: string | null;
    endDate: string | null;
  };
  description: string;
  modalities: string[];
  accession: string;
  pageNumber: number;
  resultsPerPage: number;
  sortBy: string;
  sortDirection: 'ascending' | 'descending' | 'none';
  configUrl?: string;
  datasources: string;
}

const defaultFilterValues: FilterValues = {
  patientName: '',
  mrn: '',
  studyDate: {
    startDate: null,
    endDate: null,
  },
  description: '',
  modalities: [],
  accession: '',
  pageNumber: 1,
  resultsPerPage: 25,
  sortBy: 'studyDate',
  sortDirection: 'descending',
  datasources: '',
};

interface WorkListProps {
  data: Types.StudyMetadata[];
  dataTotal: number;
  isLoadingData: boolean;
  dataSource: {
    query: Record<string, any>;
    getConfig?: () => any;
  };
  hotkeysManager: Record<string, any>;
  dataPath: string;
  onRefresh: () => void;
  servicesManager: Record<string, any>;
}

function WorkList(props: WorkListProps) {
  const {
    data: studies,
    dataTotal: studiesTotal,
    isLoadingData,
    dataSource,
    hotkeysManager,
    dataPath,
    onRefresh,
    servicesManager,
  } = props;
  const { show, hide } = useModal();
  const { t } = useTranslation();
  const [appConfig] = useAppConfig();
  const searchParams = useSearchParams();
  const navigate = useNavigate();
  const STUDIES_LIMIT = 101;
  const queryFilterValues = _getQueryFilterValues(searchParams);
  const [sessionQueryFilterValues, updateSessionQueryFilterValues] = useSessionStorage({
    key: 'queryFilterValues',
    defaultValue: queryFilterValues,
    clearOnUnload: true,
  });
  const [filterValues, setFilterValues] = useState<FilterValues>({
    patientName: '',
    mrn: '',
    studyDate: {
      startDate: null,
      endDate: null,
    },
    description: '',
    modalities: [] as string[],
    accession: '',
    pageNumber: 1,
    resultsPerPage: 25,
    sortBy: 'studyDate',
    sortDirection: 'descending',
    datasources: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [selectedModality, setSelectedModality] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All Sources');
  const [availableModalities] = useState<string[]>(['All', 'CT', 'MR', 'DX', 'IO', 'CR']);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const debouncedFilterValues = useDebounce(filterValues, 200);
  const { resultsPerPage, pageNumber, sortBy, sortDirection } = filterValues;

  const canSort = studiesTotal < STUDIES_LIMIT;
  const shouldUseDefaultSort = sortBy === '' || !sortBy;
  const sortModifier = sortDirection === 'descending' ? 1 : -1;
  const defaultSortValues =
    shouldUseDefaultSort && canSort ? { sortBy: 'studyDate', sortDirection: 'ascending' } : {};
  const { customizationService } = servicesManager.services;

  const sortedStudies = useMemo(() => {
    if (!canSort) {
      return studies;
    }

    return [...studies].sort((s1, s2) => {
      if (shouldUseDefaultSort) {
        const ascendingSortModifier = -1;
        return _sortStringDates(s1, s2, ascendingSortModifier);
      }

      const s1Prop = s1[sortBy];
      const s2Prop = s2[sortBy];

      if (typeof s1Prop === 'string' && typeof s2Prop === 'string') {
        return s1Prop.localeCompare(s2Prop) * sortModifier;
      } else if (typeof s1Prop === 'number' && typeof s2Prop === 'number') {
        return (s1Prop > s2Prop ? 1 : -1) * sortModifier;
      } else if (!s1Prop && s2Prop) {
        return -1 * sortModifier;
      } else if (!s2Prop && s1Prop) {
        return 1 * sortModifier;
      } else if (sortBy === 'studyDate') {
        return _sortStringDates(s1, s2, sortModifier);
      }

      return 0;
    });
  }, [canSort, studies, shouldUseDefaultSort, sortBy, sortModifier]);

  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [studiesWithSeriesData, setStudiesWithSeriesData] = useState<string[]>([]);
  const numOfStudies = studiesTotal;
  const querying = useMemo(() => {
    return isLoadingData || expandedRows.length > 0;
  }, [isLoadingData, expandedRows]);

  const updateFilterValues = (val: FilterValues) => {
    if (filterValues.pageNumber === val.pageNumber) {
      val.pageNumber = 1;
    }
    setFilterValues(val);
    updateSessionQueryFilterValues(val);
    setExpandedRows([]);
  };

  const onPageNumberChange = (newPageNumber: number) => {
    const oldPageNumber = filterValues.pageNumber;
    const rollingPageNumberMod = Math.floor(101 / filterValues.resultsPerPage);
    const rollingPageNumber = oldPageNumber % rollingPageNumberMod;
    const isNextPage = newPageNumber > oldPageNumber;
    const hasNextPage = Math.max(rollingPageNumber, 1) * resultsPerPage < numOfStudies;

    if (isNextPage && !hasNextPage) {
      return;
    }

    updateFilterValues({ ...filterValues, pageNumber: newPageNumber });
  };

  const onResultsPerPageChange = (newResultsPerPage: number) => {
    updateFilterValues({
      ...filterValues,
      pageNumber: 1,
      resultsPerPage: Number(newResultsPerPage),
    });
  };

  useEffect(() => {
    document.body.classList.add('bg-black');
    return () => {
      document.body.classList.remove('bg-black');
    };
  }, []);

  useEffect(() => {
    if (!debouncedFilterValues) {
      return;
    }

    const queryString: Record<string, any> = {};
    Object.entries(filterValues).forEach(([key, currValue]) => {
      if (currValue && key === 'studyDate') {
        if (currValue.startDate) {
          queryString.startDate = currValue.startDate;
        }
        if (currValue.endDate) {
          queryString.endDate = currValue.endDate;
        }
      } else if (key === 'modalities' && Array.isArray(currValue) && currValue.length) {
        queryString.modalities = currValue.join(',');
      } else if (currValue) {
        queryString[key] = currValue;
      }
    });

    preserveQueryStrings(queryString);

    const search = qs.stringify(queryString, {
      skipNull: true,
      skipEmptyString: true,
    });
    navigate({
      pathname: '/',
      search: search ? `?${search}` : undefined,
    });
  }, [debouncedFilterValues, navigate, filterValues]);

  useEffect(() => {
    const fetchSeries = async (studyInstanceUid: string) => {
      try {
        const series = await dataSource.query.series.search(studyInstanceUid);
        seriesInStudiesMap.set(studyInstanceUid, sortBySeriesDate(series));
        setStudiesWithSeriesData([...studiesWithSeriesData, studyInstanceUid]);
      } catch (ex) {
        console.warn(ex);
      }
    };

    for (let z = 0; z < expandedRows.length; z++) {
      const expandedRowIndex = expandedRows[z] - 1;
      const studyInstanceUid = sortedStudies[expandedRowIndex].studyInstanceUid;

      if (studiesWithSeriesData.includes(studyInstanceUid)) {
        continue;
      }

      fetchSeries(studyInstanceUid);
    }
  }, [expandedRows, studies, sortedStudies, studiesWithSeriesData, dataSource.query.series]);

  const isFiltering = (filterValues: FilterValues, defaultFilterValues: FilterValues) => {
    return !isEqual(filterValues, defaultFilterValues);
  };

  const rollingPageNumberMod = Math.floor(101 / resultsPerPage);
  const rollingPageNumber = (pageNumber - 1) % rollingPageNumberMod;
  const offset = resultsPerPage * rollingPageNumber;
  const offsetAndTake = offset + resultsPerPage;
  const tableDataSource = sortedStudies.map((study, key) => {
    const rowKey = key + 1;
    const isExpanded = expandedRows.some(k => k === rowKey);
    const {
      studyInstanceUid,
      accession,
      modalities: studyModalities,
      instances,
      description,
      mrn,
      patientName,
      date,
      time,
    } = study as Types.StudyMetadata;

    const modalities = Array.isArray(studyModalities) ? studyModalities : [studyModalities];

    const studyDate =
      date &&
      moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true).isValid() &&
      moment(date, ['YYYYMMDD', 'YYYY.MM.DD']).format(t('Common:localDateFormat', 'MMM-DD-YYYY'));
    const studyTime =
      time &&
      moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).isValid() &&
      moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).format(
        t('Common:localTimeFormat', 'hh:mm A')
      );

    const makeCopyTooltipCell = (textValue: string | undefined | null) => {
      if (!textValue) {
        return '';
      }
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-pointer truncate">{textValue}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex items-center justify-between gap-2">
              {textValue}
              <Clipboard>{textValue}</Clipboard>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    };

    return {
      dataCY: `studyRow-${studyInstanceUid}`,
      clickableCY: studyInstanceUid,
      row: [
        {
          key: 'patientName',
          content: patientName ? makeCopyTooltipCell(patientName as string) : null,
          gridCol: 4,
        },
        {
          key: 'mrn',
          content: makeCopyTooltipCell(mrn as string),
          gridCol: 3,
        },
        {
          key: 'studyDate',
          content: (
            <>
              {studyDate && <span className="mr-4">{studyDate}</span>}
              {studyTime && <span>{studyTime}</span>}
            </>
          ),
          title: `${studyDate || ''} ${studyTime || ''}`,
          gridCol: 5,
        },
        {
          key: 'description',
          content: makeCopyTooltipCell(description as string),
          gridCol: 4,
        },
        {
          key: 'modality',
          content: modalities,
          title: modalities,
          gridCol: 3,
        },
        {
          key: 'accession',
          content: makeCopyTooltipCell(accession as string),
          gridCol: 3,
        },
        {
          key: 'instances',
          content: (
            <>
              <Icons.GroupLayers
                className={classnames('mr-2 inline-flex w-4', {
                  'text-primary': isExpanded,
                  'text-secondary-light': !isExpanded,
                })}
              />
              {instances}
            </>
          ),
          title: (instances || 0).toString(),
          gridCol: 2,
        },
      ],
      expandedContent: (
        <StudyListExpandedRow
          seriesTableColumns={{
            description: t('StudyList:Description'),
            modality: t('StudyList:Modality'),
            instances: t('StudyList:Instances'),
          }}
          seriesTableDataSource={
            seriesInStudiesMap.has(studyInstanceUid)
              ? seriesInStudiesMap.get(studyInstanceUid).map((s: Types.SeriesMetadata) => {
                  return {
                    description: s.description || '(empty)',
                    seriesNumber: s.seriesNumber ?? '',
                    modality: s.modality || '',
                    instances: s.numSeriesInstances || '',
                  };
                })
              : []
          }
        >
          <div className="flex flex-row gap-2">
            {(appConfig.groupEnabledModesFirst
              ? appConfig.loadedModes.sort((a, b) => {
                  const isValidA = a.isValidMode({
                    modalities: modalities.join(',').replaceAll('/', '\\'),
                    study,
                  }).valid;
                  const isValidB = b.isValidMode({
                    modalities: modalities.join(',').replaceAll('/', '\\'),
                    study,
                  }).valid;

                  return (isValidB ? 1 : 0) - (isValidA ? 1 : 0);
                })
              : appConfig.loadedModes
            ).map((mode, i) => {
              const modalitiesToCheck = modalities.join(',').replaceAll('/', '\\');

              const { valid: isValidMode, description: invalidModeDescription } = mode.isValidMode({
                modalities: modalitiesToCheck,
                study,
              });
              const query = new URLSearchParams();
              if (filterValues.configUrl) {
                query.append('configUrl', filterValues.configUrl);
              }
              query.append('StudyInstanceUIDs', studyInstanceUid);
              preserveQueryParameters(query);

              return mode.displayName ? (
                <Link
                  className={isValidMode ? '' : 'cursor-not-allowed'}
                  key={i}
                  to={`${mode.routeName}${dataPath || ''}?${query.toString()}`}
                  onClick={event => {
                    if (!isValidMode) {
                      event.preventDefault();
                    }
                  }}
                >
                  <Button
                    variant="default"
                    size="small"
                    disabled={!isValidMode}
                    startIconTooltip={
                      !isValidMode ? (
                        <div className="font-inter flex w-[206px] whitespace-normal text-left text-xs font-normal text-white">
                          {invalidModeDescription}
                        </div>
                      ) : null
                    }
                    startIcon={
                      isValidMode ? (
                        <Icons.LaunchArrow className="!h-[20px] !w-[20px] text-black" />
                      ) : (
                        <Icons.LaunchInfo className="!h-[20px] !w-[20px] text-black" />
                      )
                    }
                    onClick={() => {}}
                    dataCY={`mode-${mode.routeName}-${studyInstanceUid}`}
                    className={isValidMode ? 'text-[13px]' : 'bg-[#000000] text-[13px]'}
                  >
                    {mode.displayName}
                  </Button>
                </Link>
              ) : null;
            })}
          </div>
        </StudyListExpandedRow>
      ),
      onClickRow: () =>
        setExpandedRows(s => (isExpanded ? s.filter(n => rowKey !== n) : [...s, rowKey])),
      isExpanded,
    };
  });

  const hasStudies = numOfStudies > 0;

  const AboutModal = customizationService.getCustomization('ohif.aboutModal');
  const UserPreferencesModal = customizationService.getCustomization('ohif.userPreferencesModal');

  const menuOptions = useMemo(() => {
    return [
      {
        id: 'about',
        title: t('Header:About'),
        icon: 'info',
        onClick: () =>
          show(AboutModal, {
            direction: 'left',
            isOpen: true,
          }),
      },
      {
        id: 'preferences',
        title: t('Header:Preferences'),
        icon: 'preferences',
        onClick: () =>
          show(UserPreferencesModal, {
            direction: 'left',
            isOpen: true,
          }),
      },
    ];
  }, [AboutModal, UserPreferencesModal, show, t]);

  const LoadingIndicatorProgress = customizationService.getCustomization(
    'ui.loadingIndicatorProgress'
  );
  const DicomUploadComponent = customizationService.getCustomization('dicomUploadComponent');

  const uploadProps =
    DicomUploadComponent && dataSource.getConfig()?.dicomUploadEnabled
      ? {
          title: 'Upload files',
          content: () => (
            <DicomUploadComponent
              dataSource={dataSource}
              onComplete={() => {
                hide();
              }}
              onStarted={() => {
                show({
                  title: 'Upload files',
                  content: () => (
                    <DicomUploadComponent
                      dataSource={dataSource}
                      onComplete={() => {
                        hide();
                      }}
                      onStarted={() => {}}
                    />
                  ),
                });
              }}
            />
          ),
        }
      : undefined;

  const dataSourceConfigurationComponent = customizationService.getCustomization(
    'ohif.dataSourceConfigurationComponent'
  );

  return (
    <div className="flex h-screen flex-col bg-black">
      <Header
        isSticky
        menuOptions={menuOptions}
        isReturnEnabled={false}
        WhiteLabeling={appConfig.whiteLabeling}
        PatientInfo="disabled"
        isInDicomViewer={false}
      />
      <Onboarding />
      <InvestigationalUseDialog dialogConfiguration={appConfig?.investigationalUseDialog} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <ScrollArea className="h-full">
          <div className="bg-[#F5F5F5] px-4 pt-3">
            {/* Stats Cards */}
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* First Card */}
              <Card className="h-28 border-[#00A693] bg-white md:h-32">
                {' '}
                {/* Mobile: h-32 (8rem/128px), Desktop: h-40 (10rem/160px) */}
                <div className="flex h-full flex-row items-center justify-between p-3 md:p-4">
                  <div>
                    <span className="text-sm text-[#475569]">Total Studies</span>
                    <span className="block text-4xl font-bold text-[#333333] md:text-5xl">77</span>
                    <span className="text-xs text-[#666666] md:text-sm">
                      &#9650; 12% from last month
                    </span>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border-[#00A693] bg-[#F5F5F5] p-1 md:h-12 md:w-12">
                    <FolderKanban className="h-6 w-6 text-[#666666] md:h-8 md:w-8" />
                  </div>
                </div>
              </Card>

              {/* Second Card */}
              <Card className="h-28 border-[#00A693] bg-white md:h-32">
                {' '}
                {/* Same responsive height */}
                <div className="flex h-full flex-row items-center justify-between p-3 md:p-4">
                  <div>
                    <span className="text-sm text-[#475569]">Today's Scans</span>
                    <span className="block text-4xl font-bold text-[#333333] md:text-5xl">8</span>
                    <span className="text-xs text-[#666666] md:text-sm">Last scan: 2:45 PM</span>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border-[#00A693] bg-[#F5F5F5] p-1 md:h-12 md:w-12">
                    <Clock4 className="h-6 w-6 text-[#666666] md:h-8 md:w-8" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Date Range Filter */}
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Date buttons - now stacked vertically on mobile */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Calendar button */}
                <Popover
                  open={isCalendarOpen}
                  onOpenChange={setIsCalendarOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="small"
                      className="!ml-0 h-8 w-8 bg-gray-700 !pl-0 !pr-0 hover:bg-gray-700"
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    >
                      <CalendarDays className="h-4 w-4 text-white" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="range"
                      selected={{
                        from: filterValues.studyDate.startDate
                          ? new Date(filterValues.studyDate.startDate)
                          : undefined,
                        to: filterValues.studyDate.endDate
                          ? new Date(filterValues.studyDate.endDate)
                          : undefined,
                      }}
                      onSelect={range => {
                        if (range?.from) {
                          updateFilterValues({
                            ...filterValues,
                            studyDate: {
                              startDate: range.from.toISOString().split('T')[0],
                              endDate: range?.to ? range.to.toISOString().split('T')[0] : null,
                            },
                          });
                        }
                      }}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>

                {/* Date range buttons */}
                {['1D', '3D', '1W', '1M', '1Y', 'ALL'].map(range => (
                  <Button
                    key={range}
                    variant="secondary"
                    size="small"
                    className={`${selectedDateRange === range ? 'text-[#333333]' : 'bg-[#00A693] text-[#E2E8F0]'} whitespace-nowrap px-3`}
                    onClick={() => setSelectedDateRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>

              {/* Search - moves below on mobile */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <InputFilter
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder="Search..."
                  className="w-full md:w-64"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    className="flex-1 md:flex-none"
                  >
                    Reset
                  </Button>
                  <Button
                    variant="default"
                    size="small"
                    className="flex-1 md:flex-none"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Modality and Source Filters - stacked on mobile */}
            <div className="mb-4 flex flex-col gap-3 pb-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-gray-400">Modality:</span>
                <ModalityButtons
                  modalities={availableModalities}
                  selectedModality={selectedModality}
                  onModalityChange={setSelectedModality}
                  className="grid grid-cols-3 gap-2 sm:flex sm:flex-row"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-gray-400">Source:</span>
                <Select
                  value={selectedSource}
                  onValueChange={setSelectedSource}
                  className="w-full sm:w-40"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Sources">All Sources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Main Study List Content */}
          <div className="flex flex-1 flex-col">
            <StudyListFilter
              numOfStudies={pageNumber * resultsPerPage > 100 ? 101 : numOfStudies}
              filtersMeta={filtersMeta}
              filterValues={{ ...filterValues, ...defaultSortValues }}
              onChange={updateFilterValues}
              clearFilters={() => updateFilterValues(defaultFilterValues)}
              isFiltering={isFiltering(filterValues, defaultFilterValues)}
              onUploadClick={uploadProps ? () => show(uploadProps) : undefined}
              getDataSourceConfigurationComponent={
                dataSourceConfigurationComponent
                  ? () => dataSourceConfigurationComponent()
                  : undefined
              }
            />

            {hasStudies ? (
              <>
                <StudyListTable
                  tableDataSource={tableDataSource.slice(offset, offsetAndTake)}
                  numOfStudies={numOfStudies}
                  querying={querying}
                  filtersMeta={filtersMeta}
                  PatientInfo="disabled"
                />
                <StudyListPagination
                  onChangePage={onPageNumberChange}
                  onChangePerPage={onResultsPerPageChange}
                  currentPage={pageNumber}
                  perPage={resultsPerPage}
                />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                {appConfig.showLoadingIndicator && isLoadingData ? (
                  <LoadingIndicatorProgress className="h-full w-full bg-black" />
                ) : (
                  <EmptyStudies />
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

WorkList.propTypes = {
  data: PropTypes.array.isRequired,
  dataSource: PropTypes.shape({
    query: PropTypes.object.isRequired,
    getConfig: PropTypes.func,
  }).isRequired,
  isLoadingData: PropTypes.bool.isRequired,
  servicesManager: PropTypes.object.isRequired,
};

function _tryParseInt(str: string | null | undefined, defaultValue: any) {
  let retValue = defaultValue;
  if (str && str.length > 0) {
    if (!isNaN(Number(str))) {
      retValue = parseInt(str);
    }
  }
  return retValue;
}

function _getQueryFilterValues(params: URLSearchParams) {
  const newParams = new URLSearchParams();
  for (const [key, value] of params) {
    newParams.set(key.toLowerCase(), value);
  }
  params = newParams;

  const queryFilterValues: FilterValues = {
    patientName: params.get('patientname') || '',
    mrn: params.get('mrn') || '',
    studyDate: {
      startDate: params.get('startdate') || null,
      endDate: params.get('enddate') || null,
    },
    description: params.get('description') || '',
    modalities: params.get('modalities') ? params.get('modalities').split(',') : [],
    accession: params.get('accession') || '',
    sortBy: params.get('sortby') || 'studyDate',
    sortDirection:
      (params.get('sortdirection') as 'ascending' | 'descending' | 'none') || 'descending',
    pageNumber: _tryParseInt(params.get('pagenumber'), 1),
    resultsPerPage: _tryParseInt(params.get('resultsperpage'), 25),
    datasources: params.get('datasources') || '',
    configUrl: params.get('configurl') || undefined,
  };

  Object.keys(queryFilterValues).forEach(
    key => queryFilterValues[key] == null && delete queryFilterValues[key]
  );

  return queryFilterValues;
}

function _sortStringDates(s1: Types.StudyMetadata, s2: Types.StudyMetadata, sortModifier: number) {
  const s1Date = moment(s1.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
  const s2Date = moment(s2.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);

  if (s1Date.isValid() && s2Date.isValid()) {
    return (s1Date.toISOString() > s2Date.toISOString() ? 1 : -1) * sortModifier;
  } else if (s1Date.isValid()) {
    return sortModifier;
  } else if (s2Date.isValid()) {
    return -1 * sortModifier;
  }
  return 0;
}

export default WorkList;
