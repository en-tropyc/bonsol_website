// Dashboard JavaScript - GitHub Repository Analytics

// Global variables
let allData = [];
let filteredData = [];
let viewsChart = null;
let clonesChart = null;
let activityChart = null;

// Chart.js default configuration
Chart.defaults.font.family = "'Courier New', Courier, monospace";
Chart.defaults.color = '#333';

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Time range buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const range = this.dataset.range;
            filterDataByRange(range);
        });
    });

    // Toggle data table
    document.getElementById('toggleTable').addEventListener('click', function() {
        const container = document.getElementById('dataTableContainer');
        const isHidden = container.style.display === 'none';
        container.style.display = isHidden ? 'block' : 'none';
        this.textContent = isHidden ? 'Hide Table' : 'Show Table';
    });
    
    // Refresh data button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        this.textContent = '⟳ Loading...';
        this.disabled = true;
        
        // Force clear cache and reload
        allData = [];
        filteredData = [];
        
        loadData().then(() => {
            this.textContent = '↻ Refresh Data';
            this.disabled = false;
        }).catch(() => {
            this.textContent = '↻ Refresh Data';
            this.disabled = false;
        });
    });
}

// Load and parse CSV data
async function loadData() {
    try {
        // Fetch the CSV file
        const response = await fetch('../data/traffic.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        
        allData = parseCSV(text);
        
        // Sort data by date (newest first for table, oldest first for charts)
        allData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Get current active range or default to 7
        const activeBtn = document.querySelector('.time-btn.active');
        const range = activeBtn ? activeBtn.dataset.range : '7';
        filterDataByRange(range);
        
        // Update last updated time
        updateLastUpdated();
        
        // Clear any previous errors
        const existingError = document.querySelector('.error');
        if (existingError) existingError.remove();
    } catch (error) {
        console.error('Error loading data:', error);
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showError('Cannot load data due to CORS restrictions. Please run a local web server or deploy to GitHub Pages.');
        } else {
            showError('Failed to load data. Please check that traffic.csv exists and try again.');
        }
    }
}

// Parse CSV text to JavaScript objects
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                const value = values[index];
                // Parse numbers, keep dates as strings
                row[header] = header === 'date' ? value : parseInt(value) || 0;
            });
            data.push(row);
        }
    }
    
    return data;
}

// Filter data by time range
function filterDataByRange(range) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (range === 'all') {
        filteredData = [...allData];
    } else {
        const days = parseInt(range);
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);
        
        filteredData = allData.filter(row => {
            const rowDate = new Date(row.date);
            return rowDate >= startDate && rowDate <= today;
        });
    }
    
    updateDashboard();
}

// Update all dashboard components
function updateDashboard() {
    updateMetrics();
    updateCharts();
    updateTable();
}

// Update metric cards
function updateMetrics() {
    // Calculate totals
    const totalViews = filteredData.reduce((sum, row) => sum + row.view_count, 0);
    const uniqueVisitors = filteredData.reduce((sum, row) => sum + row.view_uniques, 0);
    const totalClones = filteredData.reduce((sum, row) => sum + row.clone_count, 0);
    const uniqueCloners = filteredData.reduce((sum, row) => sum + row.clone_uniques, 0);
    
    // Update values
    document.getElementById('totalViews').textContent = totalViews.toLocaleString();
    document.getElementById('uniqueVisitors').textContent = uniqueVisitors.toLocaleString();
    document.getElementById('totalClones').textContent = totalClones.toLocaleString();
    document.getElementById('uniqueCloners').textContent = uniqueCloners.toLocaleString();
    
    // Calculate and display changes (compare to previous period)
    if (filteredData.length > 1) {
        const midPoint = Math.floor(filteredData.length / 2);
        const firstHalf = filteredData.slice(0, midPoint);
        const secondHalf = filteredData.slice(midPoint);
        
        updateChangeIndicator('viewsChange', 
            firstHalf.reduce((sum, row) => sum + row.view_count, 0),
            secondHalf.reduce((sum, row) => sum + row.view_count, 0)
        );
        
        updateChangeIndicator('visitorsChange',
            firstHalf.reduce((sum, row) => sum + row.view_uniques, 0),
            secondHalf.reduce((sum, row) => sum + row.view_uniques, 0)
        );
        
        updateChangeIndicator('clonesChange',
            firstHalf.reduce((sum, row) => sum + row.clone_count, 0),
            secondHalf.reduce((sum, row) => sum + row.clone_count, 0)
        );
        
        updateChangeIndicator('clonersChange',
            firstHalf.reduce((sum, row) => sum + row.clone_uniques, 0),
            secondHalf.reduce((sum, row) => sum + row.clone_uniques, 0)
        );
    }
}

// Update change indicator
function updateChangeIndicator(elementId, oldValue, newValue) {
    const element = document.getElementById(elementId);
    if (oldValue === 0) {
        element.textContent = newValue > 0 ? '↑ New activity' : '→ No change';
        element.className = newValue > 0 ? 'metric-change positive' : 'metric-change';
        return;
    }
    
    const change = ((newValue - oldValue) / oldValue * 100).toFixed(1);
    const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
    const className = change > 0 ? 'positive' : change < 0 ? 'negative' : '';
    
    element.textContent = `${arrow} ${Math.abs(change)}%`;
    element.className = `metric-change ${className}`;
}

// Update charts
function updateCharts() {
    const labels = filteredData.map(row => formatDate(row.date));
    
    // Views Chart
    const viewsCtx = document.getElementById('viewsChart').getContext('2d');
    if (viewsChart) viewsChart.destroy();
    
    viewsChart = new Chart(viewsCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Views',
                data: filteredData.map(row => row.view_count),
                borderColor: '#333',
                backgroundColor: 'rgba(51, 51, 51, 0.1)',
                tension: 0.1,
                fill: true
            }, {
                label: 'Unique Visitors',
                data: filteredData.map(row => row.view_uniques),
                borderColor: '#666',
                backgroundColor: 'rgba(102, 102, 102, 0.1)',
                borderDash: [5, 5],
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
    
    // Clones Chart
    const clonesCtx = document.getElementById('clonesChart').getContext('2d');
    if (clonesChart) clonesChart.destroy();
    
    clonesChart = new Chart(clonesCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Clones',
                data: filteredData.map(row => row.clone_count),
                borderColor: '#333',
                backgroundColor: 'rgba(51, 51, 51, 0.1)',
                tension: 0.1,
                fill: true
            }, {
                label: 'Unique Cloners',
                data: filteredData.map(row => row.clone_uniques),
                borderColor: '#666',
                backgroundColor: 'rgba(102, 102, 102, 0.1)',
                borderDash: [5, 5],
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
    
    // Combined Activity Chart
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    if (activityChart) activityChart.destroy();
    
    activityChart = new Chart(activityCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Views',
                data: filteredData.map(row => row.view_count),
                backgroundColor: 'rgba(51, 51, 51, 0.8)',
                stack: 'Stack 0'
            }, {
                label: 'Clones',
                data: filteredData.map(row => row.clone_count),
                backgroundColor: 'rgba(102, 102, 102, 0.8)',
                stack: 'Stack 1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const index = context.dataIndex;
                            const uniques = context.dataset.label === 'Views' 
                                ? filteredData[index].view_uniques 
                                : filteredData[index].clone_uniques;
                            return `Unique: ${uniques}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: false,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Update data table
function updateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    // Show data in reverse order (newest first)
    const reversedData = [...filteredData].reverse();
    
    reversedData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(row.date)}</td>
            <td>${row.view_count}</td>
            <td>${row.view_uniques}</td>
            <td>${row.clone_count}</td>
            <td>${row.clone_uniques}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
}

// Update last updated timestamp
function updateLastUpdated() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const dateStr = now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
    
    document.getElementById('lastUpdated').textContent = 
        `Last updated: ${dateStr} at ${timeStr}`;
}

// Show error message
function showError(message) {
    const container = document.querySelector('.container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    container.insertBefore(errorDiv, container.firstChild);
}

// Auto-refresh data every 5 minutes
setInterval(() => {
    loadData();
}, 5 * 60 * 1000);