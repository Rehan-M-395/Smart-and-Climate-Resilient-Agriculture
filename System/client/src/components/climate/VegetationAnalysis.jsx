import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLeaf,
  faCarrot,
  faInfoCircle,
  faChartLine,
  faFlask,
  faTable,
  faSeedling,
  faChartBar,
  faDna,
  faSun
} from '@fortawesome/free-solid-svg-icons';
import { Chart as ChartJS, LineElement, PointElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useAppContext } from '../../context/AppContext';
import { fetchVegetationData } from '../../services/climateService';
import Papa from 'papaparse';

// Register ChartJS components
ChartJS.register(
  LineElement,
  PointElement, 
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const VegetationAnalysis = ({ dateRange = {} }) => {
  // Define loading state locally
  const [loading, setLoading] = useState(false);
  const { selectedField, selectedLocation } = useAppContext();
  
  // Set default date range if not provided
  const defaultDateRange = {
    startDate: dateRange.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: dateRange.endDate || new Date().toISOString().split('T')[0] // Today
  };
  
  // State for vegetation data from the API
  const [vegetationData, setVegetationData] = useState({
    fieldSections: []
  });
  
  // State for vegetation indices from CSV files
  const [vegetationIndices, setVegetationIndices] = useState({
    ndvi: [],
    evi: [],
    gci: [],
    psri: [],
    ndre: [],
    cri1: [],
    loading: true
  });
  
  // Key observations and nutrient content
  const [keyObservations, setKeyObservations] = useState({
    health: { value: 82, status: 'Good' },
    stress: { value: 18, status: 'Low' },
    aging: { value: 25, status: 'Normal' },
    chlorophyll: { value: 79, status: 'Optimal' },
    nutrients: {
      nitrogen: { value: 45, status: 'Adequate' },
      phosphorus: { value: 32, status: 'Low' },
      potassium: { value: 180, status: 'High' },
      magnesium: { value: 58, status: 'Adequate' }
    }
  });
  
  // Recommended crops based on soil and vegetation analysis
  const [recommendedCrops, setRecommendedCrops] = useState({
    leafyGreen: ['Spinach', 'Kale', 'Lettuce'],
    vegetables: ['Tomatoes', 'Peppers', 'Carrots'],
    fruits: ['Strawberries', 'Blueberries'],
    grains: ['Wheat', 'Barley'],
    pulses: ['Lentils', 'Chickpeas'],
    herbsSpices: ['Basil', 'Mint', 'Coriander']
  });
  
  // Add chart visibility states and refs for chart instances to properly clean up
  const ndviChartRef = useRef(null);
  const eviChartRef = useRef(null);
  const gciChartRef = useRef(null);
  const psriChartRef = useRef(null);
  const ndreChartRef = useRef(null);
  const cri1ChartRef = useRef(null);
  const vegetationIndicesChartRef = useRef(null);
  const nutrientsChartRef = useRef(null);
  
  // Chart container refs to check if they're in the DOM
  const ndviContainerRef = useRef(null);
  const eviContainerRef = useRef(null);
  const gciContainerRef = useRef(null);
  const psriContainerRef = useRef(null);
  const ndreContainerRef = useRef(null);
  const cri1ContainerRef = useRef(null);
  const vegetationIndicesContainerRef = useRef(null);
  const nutrientsContainerRef = useRef(null);
  
  // Track chart visibility to prevent errors
  const [chartsVisible, setChartsVisible] = useState({
    ndvi: false,
    evi: false,
    gci: false,
    psri: false,
    ndre: false,
    cri1: false,
    vegetationIndices: false,
    nutrients: false
  });
  
  // Function to safely destroy a chart instance
  const safeDestroyChart = (chartRef) => {
    try {
      if (chartRef.current?.chartInstance) {
        chartRef.current.chartInstance.destroy();
      } else if (chartRef.current) {
        chartRef.current.destroy();
      }
    } catch (error) {
      console.error("Error destroying chart:", error);
    }
  };

  // Check if chart containers are in DOM and set visibility
  useEffect(() => {
    const checkVisibility = () => {
      setChartsVisible({
        ndvi: !!document.getElementById('ndvi-chart-container'),
        evi: !!document.getElementById('evi-chart-container'),
        gci: !!document.getElementById('gci-chart-container'),
        psri: !!document.getElementById('psri-chart-container'),
        ndre: !!document.getElementById('ndre-chart-container'),
        cri1: !!document.getElementById('cri1-chart-container'),
        vegetationIndices: !!document.getElementById('vegetation-indices-chart-container'),
        nutrients: !!document.getElementById('nutrients-chart-container')
      });
    };
    
    // Initial check
    checkVisibility();
    
    // Add resize observer to recheck on layout changes
    const observer = new ResizeObserver(() => {
      checkVisibility();
    });
    
    // Observe the main Analytics container
    const analyticsContainer = document.querySelector('.Analytics');
    if (analyticsContainer) {
      observer.observe(analyticsContainer);
    }
    
    return () => {
      // Clean up the observer
      observer.disconnect();
      
      // Safely destroy all chart instances
      safeDestroyChart(ndviChartRef);
      safeDestroyChart(eviChartRef);
      safeDestroyChart(gciChartRef);
      safeDestroyChart(psriChartRef);
      safeDestroyChart(ndreChartRef);
      safeDestroyChart(cri1ChartRef);
      safeDestroyChart(vegetationIndicesChartRef);
      safeDestroyChart(nutrientsChartRef);
    };
  }, []);
  
  useEffect(() => {
    loadVegetationData();
    loadVegetationIndicesFromCsv();
  }, [selectedField, selectedLocation, defaultDateRange.startDate, defaultDateRange.endDate]);
  
  const loadVegetationData = async () => {
    setLoading(true);
    try {
      const data = await fetchVegetationData(
        selectedField,
        selectedLocation,
        defaultDateRange
      );
      setVegetationData(data);
    } catch (error) {
      console.error('Error loading vegetation data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to load vegetation indices from CSV files
  const loadVegetationIndicesFromCsv = async () => {
    setVegetationIndices(prev => ({ ...prev, loading: true }));
    
    try {
      // Helper function to fetch and parse CSV
      const fetchCsv = async (filename) => {
        const response = await fetch(`/local_csv/${filename}`);
        const text = await response.text();
        return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
      };
      
      // Load all CSV files in parallel
      const [ndviData, eviData, gciData, psriData, ndreData, cri1Data] = await Promise.all([
        fetchCsv('ndvi.csv'),
        fetchCsv('evi.csv'),
        fetchCsv('gci.csv'),
        fetchCsv('psri.csv'),
        fetchCsv('ndre.csv'),
        fetchCsv('cri1.csv')
      ]);
      
      // Process each dataset to extract date and values
      const processData = (data, valueField) => {
        return data.map(item => ({
          date: item.date,
          value: parseFloat(item[valueField])
        })).filter(item => !isNaN(item.value))
         .sort((a, b) => new Date(a.date) - new Date(b.date));
      };
      
      setVegetationIndices({
        ndvi: processData(ndviData, 'ndvi'),
        evi: processData(eviData, 'evi'),
        gci: processData(gciData, 'gci'),
        psri: processData(psriData, 'psri'),
        ndre: processData(ndreData, 'ndre'),
        cri1: processData(cri1Data, 'cri1'),
        loading: false
      });
      
      // Log the counts of each dataset to verify data loading
      console.log('NDVI data points:', processData(ndviData, 'ndvi').length);
      console.log('EVI data points:', processData(eviData, 'evi').length);
      console.log('GCI data points:', processData(gciData, 'gci').length);
      console.log('PSRI data points:', processData(psriData, 'psri').length);
      console.log('NDRE data points:', processData(ndreData, 'ndre').length);
      console.log('CRI1 data points:', processData(cri1Data, 'cri1').length);
      
    } catch (error) {
      console.error('Error loading vegetation indices from CSV:', error);
      setVegetationIndices(prev => ({ ...prev, loading: false }));
    }
  };
  
  // Enhanced chart options with improved UI
  const getChartOptions = (title, customOptions = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 11
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255,255,255,0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        titleFont: {
          weight: 'bold',
          size: 13
        },
        bodyFont: {
          size: 12
        },
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        cornerRadius: 4,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y !== null ? context.parsed.y.toFixed(3) : 'N/A';
            return `${label.split(' - ')[0]}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            weight: 'bold',
            size: 12
          },
          padding: {
            top: 10
          }
        },
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: customOptions.beginAtZero !== undefined ? customOptions.beginAtZero : false,
        title: {
          display: true,
          text: customOptions.yAxisTitle || 'Value',
          font: {
            weight: 'bold',
            size: 12
          },
          padding: {
            bottom: 10
          }
        },
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        hitRadius: 8
      }
    }
  });
  
  // Format date function for chart labels
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    } catch (e) {
      console.error('Invalid date:', dateString);
      return '';
    }
  };

  // Generate chart data for vegetation indices
  const getVegetationIndicesChartData = (indices = vegetationIndices) => {
    // Enhanced color map with visually distinct colors
    const colorMap = {
      ndvi: {
        border: 'rgb(56, 142, 60)',  // Forest green
        background: 'rgba(56, 142, 60, 0.1)',
        pointBgColor: 'rgb(56, 142, 60)',
        pointBorderColor: 'white',
        dashed: false
      },
      evi: {
        border: 'rgb(0, 137, 123)',  // Teal
        background: 'rgba(0, 137, 123, 0.1)',
        pointBgColor: 'rgb(0, 137, 123)',
        pointBorderColor: 'white',
        dashed: false
      },
      gci: {
        border: 'rgb(104, 159, 56)',  // Light green
        background: 'rgba(104, 159, 56, 0.1)',
        pointBgColor: 'rgb(104, 159, 56)',
        pointBorderColor: 'white',
        dashed: false
      },
      psri: {
        border: 'rgb(255, 87, 34)',  // Deep orange
        background: 'rgba(255, 87, 34, 0.1)',
        pointBgColor: 'rgb(255, 87, 34)',
        pointBorderColor: 'white',
        dashed: true
      },
      ndre: {
        border: 'rgb(121, 85, 72)',  // Brown
        background: 'rgba(121, 85, 72, 0.1)',
        pointBgColor: 'rgb(121, 85, 72)',
        pointBorderColor: 'white',
        dashed: false
      },
      cri1: {
        border: 'rgb(156, 39, 176)',  // Purple
        background: 'rgba(156, 39, 176, 0.1)',
        pointBgColor: 'rgb(156, 39, 176)',
        pointBorderColor: 'white',
        dashed: true
      }
    };
    
    // Find all dates from all indices
    const allDates = new Set();
    Object.entries(indices)
      .filter(([key, value]) => key !== 'loading' && Array.isArray(value) && value.length > 0)
      .forEach(([_, dataset]) => {
        dataset.forEach(item => {
          if (item.date) allDates.add(item.date);
        });
      });
    
    const sortedDates = [...allDates].sort((a, b) => new Date(a) - new Date(b));
    const labels = sortedDates.map(date => formatDate(date));
    
    // Create datasets for each index with enhanced visualization properties
    const datasets = [];
    
    // Define display names and ensure normalized ranges for better comparison
    const indexDefinitions = {
      ndvi: { 
        label: 'NDVI - Vegetation Index',
        description: 'Vegetation health & density',
        order: 1
      },
      evi: { 
        label: 'EVI - Enhanced Vegetation',
        description: 'Improved vegetation detection',
        order: 2
      },
      gci: { 
        label: 'GCI - Chlorophyll Index',
        description: 'Chlorophyll content estimate',
        order: 3
      },
      psri: { 
        label: 'PSRI - Senescence Index',
        description: 'Plant aging & stress',
        order: 4
      },
      ndre: { 
        label: 'NDRE - Red Edge Index',
        description: 'Nitrogen & chlorophyll detection',
        order: 5
      },
      cri1: { 
        label: 'CRI1 - Carotenoid Index',
        description: 'Carotenoid pigment detection',
        order: 6
      }
    };
    
    // Process each index type
    const processedIndices = Object.entries(indices)
      .filter(([key, value]) => key !== 'loading' && Array.isArray(value) && value.length > 0)
      .sort(([keyA], [keyB]) => {
        // Sort by defined order to ensure consistent legend display
        return (indexDefinitions[keyA]?.order || 99) - (indexDefinitions[keyB]?.order || 99);
      });
      
    processedIndices.forEach(([key, data]) => {
      // Create a map of date to value for quick lookup
      const dateValueMap = {};
      data.forEach(item => {
        // Ensure we have valid numeric values
        if (item.date && !isNaN(parseFloat(item.value))) {
          dateValueMap[item.date] = parseFloat(item.value);
        }
      });
      
      // Only include datasets that actually have values
      if (Object.keys(dateValueMap).length > 0) {
        // For each date, get the value or null
        const values = sortedDates.map(date => {
          const value = dateValueMap[date];
          return value !== undefined ? value : null;
        });
        
        // Get index information
        const indexInfo = indexDefinitions[key] || { 
          label: key.toUpperCase(), 
          description: 'Vegetation/plant health index'
        };
        
        // Create enhanced dataset with proper styling
        datasets.push({
          label: indexInfo.label,
          data: values,
          borderColor: colorMap[key].border,
          backgroundColor: colorMap[key].background,
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointStyle: 'circle',
          pointBackgroundColor: colorMap[key].pointBgColor,
          pointBorderColor: colorMap[key].pointBorderColor,
          pointBorderWidth: 1.5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: colorMap[key].pointBgColor,
          pointHoverBorderColor: 'white',
          pointHoverBorderWidth: 2,
          borderDash: colorMap[key].dashed ? [5, 5] : undefined,
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
          spanGaps: true, // Connect lines across missing data points
          clip: 5,
          order: indexInfo.order || 1
        });
      }
    });
    
    // If no datasets were created, create a placeholder dataset
    if (datasets.length === 0) {
      datasets.push({
        label: 'No Data Available',
        data: sortedDates.map(() => null),
        borderColor: 'rgb(200, 200, 200)',
        backgroundColor: 'rgba(200, 200, 200, 0.1)',
        borderWidth: 2,
        fill: false
      });
    }
    
    return {
      labels,
      datasets
    };
  };
  
  // Generate specific chart data for NDVI
  const getNdviChartData = () => {
    const ndviData = vegetationIndices.ndvi;
    
    // Return empty dataset if no data
    if (!ndviData || ndviData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'NDVI',
          data: [],
          fill: true,
          backgroundColor: 'rgba(75, 192, 75, 0.2)',
          borderColor: 'rgb(75, 192, 75)',
          tension: 0.3
        }]
      };
    }
    
    // Process the data
    const sortedData = [...ndviData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedData.map(item => formatDate(item.date));
    const values = sortedData.map(item => item.value);
    
    return {
      labels,
      datasets: [
        {
          label: 'NDVI',
          data: values,
          fill: true,
          backgroundColor: 'rgba(56, 142, 60, 0.2)',
          borderColor: 'rgb(56, 142, 60)',
          tension: 0.3,
          pointBackgroundColor: 'rgb(56, 142, 60)',
          pointBorderColor: 'white',
          pointBorderWidth: 1.5,
          pointRadius: 4
        }
      ]
    };
  };

  const getEviChartData = () => {
    const eviData = vegetationIndices.evi;
    
    if (!eviData || eviData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'EVI',
          data: [],
          fill: true,
          backgroundColor: 'rgba(75, 192, 75, 0.2)',
          borderColor: 'rgb(75, 192, 75)',
          tension: 0.3
        }]
      };
    }
    
    // Process the data
    const sortedData = [...eviData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedData.map(item => formatDate(item.date));
    const values = sortedData.map(item => item.value);
    
    return {
      labels,
      datasets: [
        {
          label: 'EVI',
          data: values,
          fill: true,
          backgroundColor: 'rgba(56, 142, 60, 0.2)',
          borderColor: 'rgb(56, 142, 60)',
          tension: 0.3,
          pointBackgroundColor: 'rgb(56, 142, 60)',
          pointBorderColor: 'white',
          pointBorderWidth: 1.5,
          pointRadius: 4
        }
      ]
    };
  };

  const getGciChartData = () => {
    const gciData = vegetationIndices.gci;
    
    if (!gciData || gciData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'GCI',
          data: [],
          fill: true,
          backgroundColor: 'rgba(75, 192, 75, 0.2)',
          borderColor: 'rgb(75, 192, 75)',
          tension: 0.3
        }]
      };
    }
    
    // Process the data
    const sortedData = [...gciData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedData.map(item => formatDate(item.date));
    const values = sortedData.map(item => item.value);
    
    return {
      labels,
      datasets: [
        {
          label: 'GCI',
          data: values,
          fill: true,
          backgroundColor: 'rgba(56, 142, 60, 0.2)',
          borderColor: 'rgb(56, 142, 60)',
          tension: 0.3,
          pointBackgroundColor: 'rgb(56, 142, 60)',
          pointBorderColor: 'white',
          pointBorderWidth: 1.5,
          pointRadius: 4
        }
      ]
    };
  };

  const getNdreChartData = () => {
    const ndreData = vegetationIndices.ndre;
    
    if (!ndreData || ndreData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'EVI',
          data: [],
          fill: true,
          backgroundColor: 'rgba(75, 192, 75, 0.2)',
          borderColor: 'rgb(75, 192, 75)',
          tension: 0.3
        }]
      };
    }
    
    // Process the data
    const sortedData = [...ndreData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedData.map(item => formatDate(item.date));
    const values = sortedData.map(item => item.value);
    
    return {
      labels,
      datasets: [
        {
          label: 'NDRE',
          data: values,
          fill: true,
          backgroundColor: 'rgba(56, 142, 60, 0.2)',
          borderColor: 'rgb(56, 142, 60)',
          tension: 0.3,
          pointBackgroundColor: 'rgb(56, 142, 60)',
          pointBorderColor: 'white',
          pointBorderWidth: 1.5,
          pointRadius: 4
        }
      ]
    };
  };

  const getPsriChartData = () => {
    const psriData = vegetationIndices.psri;
    
    if (!psriData || psriData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'PSRI',
          data: [],
          fill: true,
          backgroundColor: 'rgba(75, 192, 75, 0.2)',
          borderColor: 'rgb(75, 192, 75)',
          tension: 0.3
        }]
      };
    }
    
    // Process the data
    const sortedData = [...psriData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedData.map(item => formatDate(item.date));
    const values = sortedData.map(item => item.value);
    
    return {
      labels,
      datasets: [
        {
          label: 'PSRI',
          data: values,
          fill: true,
          backgroundColor: 'rgba(56, 142, 60, 0.2)',
          borderColor: 'rgb(56, 142, 60)',
          tension: 0.3,
          pointBackgroundColor: 'rgb(56, 142, 60)',
          pointBorderColor: 'white',
          pointBorderWidth: 1.5,
          pointRadius: 4
        }
      ]
    };
  };

  const getCri1ChartData = () => {
    const cri1Data = vegetationIndices.cri1;
    
    if (!cri1Data || cri1Data.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'EVI',
          data: [],
          fill: true,
          backgroundColor: 'rgba(75, 192, 75, 0.2)',
          borderColor: 'rgb(75, 192, 75)',
          tension: 0.3
        }]
      };
    }
    
    // Process the data
    const sortedData = [...cri1Data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedData.map(item => formatDate(item.date));
    const values = sortedData.map(item => item.value);
    
    return {
      labels,
      datasets: [
        {
          label: 'CRI1',
          data: values,
          fill: true,
          backgroundColor: 'rgba(56, 142, 60, 0.2)',
          borderColor: 'rgb(56, 142, 60)',
          tension: 0.3,
          pointBackgroundColor: 'rgb(56, 142, 60)',
          pointBorderColor: 'white',
          pointBorderWidth: 1.5,
          pointRadius: 4
        }
      ]
    };
  };
  
  // Generate chart data for nutrients
  const getNutrientsChartData = () => {
    return {
      labels: ['Nitrogen', 'Phosphorus', 'Potassium', 'Magnesium'],
      datasets: [
        {
          label: 'Nutrient Content',
          data: [
            keyObservations.nutrients.nitrogen.value,
            keyObservations.nutrients.phosphorus.value,
            keyObservations.nutrients.potassium.value,
            keyObservations.nutrients.magnesium.value
          ],
          backgroundColor: [
            'rgba(46, 125, 50, 0.7)',  // Dark green
            'rgba(255, 111, 0, 0.7)',  // Orange
            'rgba(25, 118, 210, 0.7)',  // Blue
            'rgba(123, 31, 162, 0.7)'   // Purple
          ],
          borderColor: [
            'rgb(46, 125, 50)',
            'rgb(255, 111, 0)',
            'rgb(25, 118, 210)',
            'rgb(123, 31, 162)'
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  // Generate the chart data for rendering
  const vegetationIndicesChartData = getVegetationIndicesChartData();
  const ndviChartData = getNdviChartData();
  const eviChartData = getEviChartData();
  const gciChartData = getGciChartData();
  const ndreChartData = getNdreChartData();
  const psriChartData = getPsriChartData();
  const cri1ChartData = getCri1ChartData();
  const nutrientsChartData = getNutrientsChartData();
  
  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'excellent':
      case 'good':
      case 'high':
      case 'adequate':
        return 'bg-green-100 text-green-800';
      case 'moderate':
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="Analytics">
      <div style={{display: "flex", flexDirection: "row", borderBottom: "1px solid rgba(0,0,0,0.2)"}} className="mb-6">
        <h2 className="text-2xl font-bold flex items-center ">
          <FontAwesomeIcon icon={faCarrot} className="text-green-600 mr-2" />
          Vegetation & Crop Health
        </h2>
        <div style={{display: "flex", flexDirection: "row", marginLeft: "auto", marginRight: "10px", alignItems: "center"}} class="IntervalRange">
          <p id="Interval">Interval:</p>
          <input type="date" id="startDate"/>
          <p id="to">to</p>
          <input type="date" id="endDate"/>
        </div>
      </div>
      
      {loading || vegetationIndices.loading ? (
        <div className="text-center py-10">
          <div className="spinner border-t-4 border-green-500 border-solid rounded-full w-12 h-12 mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Loading vegetation data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* NDVI Chart - Enhanced UI */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-100">
            <div style={{display: "flex",flexDirection: "column",overflowY: "hidden", transitionDuration: "200ms", transitionTimingFunction: "linear", transitionProperty: "all"}} className="flex items-center mb-0 h-8 hover:h-45">
              <h3 style={{borderBottom: "1px solid rgba(0,0,0,0.2)"}} className="text-lg w-full pl-2 pb-0.5"><b className="font-semibold">NDVI - </b><span style={{fontSize: "17px"}} className="">crop health, greenness, biomass</span></h3>
  
              <div style={{fontSize: "14px",borderBottom: "1px solid rgba(0,0,0,0.2)"}} class="chart-info-content pl-2 pr-2 pb-1">
                <p id="defination">It measures the <b>amount and health of green vegetation</b> by comparing how plants reflect near-infrared (NIR) light and absorb red light.</p>
                <p id="scale-range">Range: -1 to +1</p>
                <p id="scale-increase"><b>Increase</b>: Vigorous plant growth, high leaf area.</p>
                <p id="scale-decrease"><b>Decrease</b>: Sparse or stressed vegetation.</p>
              </div>
          
            </div>
            <div className="h-72 pl-1 pr-1 ">
              <div id="ndvi-chart-container" className="w-full h-full" ref={ndviContainerRef}>
                {chartsVisible.ndvi && (
                  <Line 
                    data={ndviChartData} 
                    options={getChartOptions('Normalized Difference Vegetation Index', {
                      yAxisTitle: 'NDVI Value',
                      beginAtZero: false
                    })} 
                    ref={ndviChartRef}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center mb-0">
              
                <h3 style={{borderBottom: "1px solid rgba(0,0,0,0.2)"}} className="text-lg w-full pl-2 pb-0.5"><b className="font-semibold">EVI - </b><span style={{fontSize: "17px"}} className="">similar to NDVI, better in dense canopies</span></h3>
            </div>
            
            {/* <div className="mb-0 p-3 bg-green-50 rounded-md text-sm border-l-4 border-green-400">
              <p className="font-medium">NDVI - Normalized Difference Vegetation Index</p>
              <p className="mt-1">Measures <b>green vegetation amount & health</b> using NIR and red light reflectance.</p>
              <p className="mt-1"><b>Range</b>: -1 to +1</p>
              <p className="mt-1"><b>Interpretation</b>: Higher values indicate healthier vegetation.</p>
            </div> */}
            <div className="h-72 pl-1 pr-1 ">
              <div id="evi-chart-container" className="w-full h-full" ref={eviContainerRef}>
                {chartsVisible.evi && (
                  <Line 
                    data={eviChartData} 
                    options={getChartOptions('Enhanced Vegetation Index', {
                      yAxisTitle: 'EVI Value',
                      beginAtZero: false
                    })} 
                    ref={eviChartRef}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center mb-0">
              
              <h3 style={{borderBottom: "1px solid rgba(0,0,0,0.2)"}} className="text-lg w-full pl-2 pb-0.5"><b className="font-semibold">GCI - </b><span style={{fontSize: "17px"}} className="">chlorophyll content, nitrogen</span></h3>
            </div>
            
            {/* <div className="mb-0 p-3 bg-green-50 rounded-md text-sm border-l-4 border-green-400">
              <p className="font-medium">NDVI - Normalized Difference Vegetation Index</p>
              <p className="mt-1">Measures <b>green vegetation amount & health</b> using NIR and red light reflectance.</p>
              <p className="mt-1"><b>Range</b>: -1 to +1</p>
              <p className="mt-1"><b>Interpretation</b>: Higher values indicate healthier vegetation.</p>
            </div> */}
            <div className="h-72 pl-1 pr-1 ">
              <div id="gci-chart-container" className="w-full h-full" ref={gciContainerRef}>
                {chartsVisible.gci && (
                  <Line 
                    data={gciChartData} 
                    options={getChartOptions('Green Chlorophyll Index', {
                      yAxisTitle: 'GCI Value',
                      beginAtZero: false
                    })} 
                    ref={gciChartRef}
                  />
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center mb-0">
              
              <h3 style={{borderBottom: "1px solid rgba(0,0,0,0.2)"}} className="text-lg w-full pl-2 pb-0.5"><b className="font-semibold">PSRI - </b><span style={{fontSize: "17px"}} className="">aging, stress, carotenoid/pigment ratio</span></h3>
            </div>
            
            {/* <div className="mb-0 p-3 bg-green-50 rounded-md text-sm border-l-4 border-green-400">
              <p className="font-medium">NDVI - Normalized Difference Vegetation Index</p>
              <p className="mt-1">Measures <b>green vegetation amount & health</b> using NIR and red light reflectance.</p>
              <p className="mt-1"><b>Range</b>: -1 to +1</p>
              <p className="mt-1"><b>Interpretation</b>: Higher values indicate healthier vegetation.</p>
            </div> */}
            <div className="h-72 pl-1 pr-1 ">
              <div id="psri-chart-container" className="w-full h-full" ref={psriContainerRef}>
                {chartsVisible.psri && (
                  <Line 
                    data={psriChartData} 
                    options={getChartOptions('Plant Senescence Reflectance Index', {
                      yAxisTitle: 'PSRI Value',
                      beginAtZero: false
                    })} 
                    ref={psriChartRef}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center mb-0">
              
              <h3 style={{borderBottom: "1px solid rgba(0,0,0,0.2)"}} className="text-lg w-full pl-2 pb-0.5"><b className="font-semibold">NDRE - </b><span style={{fontSize: "17px"}} className="">chlorophyll concentration in canopy</span></h3>
            </div>
            
            {/* <div className="mb-0 p-3 bg-green-50 rounded-md text-sm border-l-4 border-green-400">
              <p className="font-medium">NDVI - Normalized Difference Vegetation Index</p>
              <p className="mt-1">Measures <b>green vegetation amount & health</b> using NIR and red light reflectance.</p>
              <p className="mt-1"><b>Range</b>: -1 to +1</p>
              <p className="mt-1"><b>Interpretation</b>: Higher values indicate healthier vegetation.</p>
            </div> */}
            <div className="h-72 pl-1 pr-1 ">
              <div id="ndre-chart-container" className="w-full h-full" ref={ndreContainerRef}>
                {chartsVisible.ndre && (
                  <Line 
                    data={ndreChartData} 
                    options={getChartOptions('Normalized Difference Red Edge Index', {
                      yAxisTitle: 'NDRE Value',
                      beginAtZero: false
                    })} 
                    ref={ndreChartRef}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center mb-0">
              
              <h3 style={{borderBottom: "1px solid rgba(0,0,0,0.2)"}} className="text-lg w-full pl-2 pb-0.5"><b className="font-semibold">CRI1 - </b><span style={{fontSize: "17px"}} className="">carotenoid content in leaves (stress-related pigments)</span></h3>
              
            </div>
            
            {/* <div className="mb-0 p-3 bg-green-50 rounded-md text-sm border-l-4 border-green-400">
              <p className="font-medium">NDVI - Normalized Difference Vegetation Index</p>
              <p className="mt-1">Measures <b>green vegetation amount & health</b> using NIR and red light reflectance.</p>
              <p className="mt-1"><b>Range</b>: -1 to +1</p>
              <p className="mt-1"><b>Interpretation</b>: Higher values indicate healthier vegetation.</p>
            </div> */}
            <div className="h-72 pl-1 pr-1 ">
              <div id="cri1-chart-container" className="w-full h-full" ref={cri1ContainerRef}>
                {chartsVisible.cri1 && (
                  <Line 
                    data={cri1ChartData} 
                    options={getChartOptions('Carotenoid Reflectance Index 1', {
                      yAxisTitle: 'CRI1 Value',
                      beginAtZero: false
                    })} 
                    ref={cri1ChartRef}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Key Observations - Enhanced UI */}
          <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <span className="text-green-600 mr-3">
                <FontAwesomeIcon icon={faChartLine} size="lg" />
              </span>
              <h3 className="text-lg font-semibold">Key Observations</h3>
            </div>
            
            <div className="space-y-4">
              {/* Health Status */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Health</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(keyObservations.health.status)}`}>
                    {keyObservations.health.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${keyObservations.health.value}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Based on NDVI and EVI values</p>
              </div>
              
              {/* Stress Detection */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Stress</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(keyObservations.stress.status)}`}>
                    {keyObservations.stress.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full" 
                    style={{ width: `${keyObservations.stress.value}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Based on PSRI and CRI1 indicators</p>
              </div>
              
              {/* Aging */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Aging</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(keyObservations.aging.status)}`}>
                    {keyObservations.aging.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${keyObservations.aging.value}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Based on PSRI values</p>
              </div>
              
              {/* Chlorophyll */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Chlorophyll</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(keyObservations.chlorophyll.status)}`}>
                    {keyObservations.chlorophyll.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${keyObservations.chlorophyll.value}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Based on GCI and NDRE values</p>
              </div>
            </div>
          </div>
          
          {/* Vegetation Indices Chart - Enhanced UI */}
          {/* <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-100 lg:col-span-2">
            <div className="flex items-center mb-4">
              <span className="text-green-600 mr-3">
                <FontAwesomeIcon icon={faChartBar} size="lg" />
              </span>
              <h3 className="text-lg font-semibold">Vegetation Indices</h3>
            </div>
            
            <div className="mb-4 p-4 bg-green-50 rounded-lg text-sm border-l-4 border-green-400">
              <h4 className="font-semibold mb-2 text-green-800">About Vegetation Indices</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[rgb(56,142,60)] mr-2"></div>
                    <span className="font-bold text-gray-800">NDVI</span>
                  </div>
                  <p className="mt-1 text-gray-600">Normalized Difference Vegetation Index - Overall vegetation health</p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[rgb(0,137,123)] mr-2"></div>
                    <span className="font-bold text-gray-800">EVI</span>
                  </div>
                  <p className="mt-1 text-gray-600">Enhanced Vegetation Index - Reduces atmospheric noise & soil background</p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[rgb(104,159,56)] mr-2"></div>
                    <span className="font-bold text-gray-800">GCI</span>
                  </div>
                  <p className="mt-1 text-gray-600">Green Chlorophyll Index - Chlorophyll content in leaves</p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[rgb(255,87,34)] mr-2"></div>
                    <span className="font-bold text-gray-800">PSRI</span>
                  </div>
                  <p className="mt-1 text-gray-600">Plant Senescence Reflectance Index - Plant aging & stress</p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[rgb(121,85,72)] mr-2"></div>
                    <span className="font-bold text-gray-800">NDRE</span>
                  </div>
                  <p className="mt-1 text-gray-600">Normalized Difference Red Edge - Nitrogen & chlorophyll content</p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[rgb(156,39,176)] mr-2"></div>
                    <span className="font-bold text-gray-800">CRI1</span>
                  </div>
                  <p className="mt-1 text-gray-600">Carotenoid Reflectance Index - Carotenoid pigments in leaves</p>
                </div>
              </div>
            </div>
            
            {/* <div className="h-96">
              {vegetationIndices.loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="spinner border-t-4 border-green-500 border-solid rounded-full w-10 h-10 animate-spin"></div>
                </div>
              ) : (
                <div id="vegetation-indices-chart-container" className="w-full h-full" ref={vegetationIndicesContainerRef}>
                  {chartsVisible.vegetationIndices && (
                    <Line 
                      data={vegetationIndicesChartData} 
                      options={getChartOptions('Vegetation Indices Over Time', {
                        yAxisTitle: 'Index Value',
                        beginAtZero: false
                      })} 
                      ref={vegetationIndicesChartRef} 
                    />
                  )}
                </div>
              )}
            </div> */}

{/*             
            <div className="mt-3 bg-gray-50 p-3 rounded-md text-xs text-gray-600 flex items-center">
              <FontAwesomeIcon icon={faInfoCircle} className="text-green-500 mr-2" />
              <span>Indices are calculated from multispectral satellite imagery and updated weekly.</span>
            </div>
          </div> */} 
          
          {/* Enhanced Soil Nutrient Analysis */}
          <div className="bg-white pl-3 pr-3 pt-2.5 pb-2 rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <FontAwesomeIcon icon={faFlask} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Soil Nutrient Analysis</h3>
              </div>
              <button className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full flex items-center">
                <FontAwesomeIcon icon={faChartBar} className="mr-1" />
                Advanced View
              </button>
            </div>
            
            {/* <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-white rounded-lg text-sm border-l-4 border-green-500">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="text-green-600 mr-2 text-lg" />
                <div>
                  <h4 className="font-semibold text-green-800">Nutrient Profile & Recommendations</h4>
                  <p>Analysis based on spectral imagery, vegetation indices, and soil test results</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Last soil test: September 1, 2025
                    </span>
                    <span className="text-amber-600">
                      Next test due: October 15, 2025
                    </span>
                  </div>
                </div>
              </div>
            </div> */}
            
            <div className="h-80 mb-0">
              <div id="nutrients-chart-container" className="w-full h-full" ref={nutrientsContainerRef}>
                {chartsVisible.nutrients && (
                  <Bar 
                    data={nutrientsChartData} 
                    options={{
                      ...getChartOptions('Macronutrient Analysis', {
                        yAxisTitle: 'Value (kg/ha)',
                        beginAtZero: true
                      }),
                      plugins: {
                        ...getChartOptions().plugins,
                        tooltip: {
                          ...getChartOptions().plugins.tooltip,
                          callbacks: {
                            label: function(context) {
                              const label = context.dataset.label || '';
                              const value = context.parsed.y !== null ? context.parsed.y : 'N/A';
                              
                              // Add nutrient status to tooltip
                              const nutrientName = context.label.toLowerCase();
                              let status = '';
                              
                              if (nutrientName === 'nitrogen') {
                                status = keyObservations.nutrients.nitrogen.status;
                              } else if (nutrientName === 'phosphorus') {
                                status = keyObservations.nutrients.phosphorus.status;
                              } else if (nutrientName === 'potassium') {
                                status = keyObservations.nutrients.potassium.status;
                              } else if (nutrientName === 'magnesium') {
                                status = keyObservations.nutrients.magnesium.status;
                              }
                              
                              return [`${label}: ${value} kg/ha`, `Status: ${status}`];
                            }
                          }
                        }
                      }
                    }} 
                    ref={nutrientsChartRef}
                  />
                )}
              </div>
            </div>            

            
          </div>

          {/* Recommended Crops */}
          <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-100 lg:col-span-1">
            <div className="flex items-center mb-4">
              <span className="text-green-600 mr-3">
                <FontAwesomeIcon icon={faSeedling} size="lg" />
              </span>
              <h3 className="text-lg font-semibold">Recommended Crops</h3>
            </div>
            
            <div className="mb-4 p-3 bg-green-50 rounded-md text-sm border-l-4 border-green-400">
              <p className="font-medium">Crops most suitable based on current soil and vegetation conditions</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="border-b pb-3">
                <div className="flex items-center text-sm font-semibold text-green-800 mb-2">
                  <FontAwesomeIcon icon={faSeedling} className="mr-2" />
                  <span>Leafy Greens</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendedCrops.leafyGreen.map((crop, index) => (
                    <span key={index} className="px-3 py-1.5 bg-green-50 text-green-800 rounded-lg text-sm">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border-b pb-3">
                <div className="flex items-center text-sm font-semibold text-green-800 mb-2">
                  <FontAwesomeIcon icon={faTable} className="mr-2" />
                  <span>Vegetables</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendedCrops.vegetables.map((crop, index) => (
                    <span key={index} className="px-3 py-1.5 bg-red-50 text-red-800 rounded-lg text-sm">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border-b pb-3">
                <div className="flex items-center text-sm font-semibold text-green-800 mb-2">
                  <FontAwesomeIcon icon={faSun} className="mr-2" />
                  <span>Fruits</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendedCrops.fruits.map((crop, index) => (
                    <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg text-sm">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border-b pb-3">
                <div className="flex items-center text-sm font-semibold text-green-800 mb-2">
                  <FontAwesomeIcon icon={faLeaf} className="mr-2" />
                  <span>Grains & Pulses</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendedCrops.grains.concat(recommendedCrops.pulses).map((crop, index) => (
                    <span key={index} className="px-3 py-1.5 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VegetationAnalysis;
