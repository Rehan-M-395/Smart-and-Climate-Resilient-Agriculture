document.querySelector('.Analytics').innerHTML = `
    <div class="title">
        <i id="weather" class="fa-solid fa-cloud-sun-rain"></i>
        <h2 id="weather_head">Weather Forecast</h2>
        <div class="IntervalRange">
            <p id="Interval">Interval:</p>
            <input type="date" id="startDate">
            <p id="to">to</p>
            <input type="date" id="endDate">
        </div>
    </div>
`;

//////////////////////////////// left bar///////////////////////////////////////

function dashboard(){
    document.querySelector('#loadContent').innerHTML = `
        <div class="title">
            <i id="dashboard" class="fa-solid fa-tractor"></i>
            <h2 id="dashboard_head">Dashboard</h2>
        </div>
    `;
}

///////////////////////////// Climate Analysis ////////////////////////////////////
function weather(){
    document.querySelector('.Analytics').innerHTML = `
        <div class="title">
            <i id="weather" class="fa-solid fa-cloud-sun-rain"></i>
            <h2 id="weather_head">Weather Forecast</h2>
            <div class="IntervalRange">
                <p id="Interval">Interval:</p>
                <input type="date" id="startDate">
                <p id="to">to</p>
                <input type="date" id="endDate">
            </div>
        </div>
    `;
}

function water(){
    document.querySelector('.Analytics').innerHTML = `
        <div class="title">
            <i id="water" class="fa-solid fa-droplet"></i>
            <h2 id="water_head">Water & Irrigation</h2>
            <div class="IntervalRange">
                <p id="Interval">Interval:</p>
                <input type="date" id="startDate">
                <p id="to">to</p>
                <input type="date" id="endDate">
            </div>
        </div>
        <div class="waterSection">
            <div class="water-container">
                <div class="ndwiChartDiv">
                    <div class="chart-info">
                        <h3 id="ndwi-chart-title">
                            NDWI - Normalized Difference Water Index 
                        </h3>
                        <p class="chart-info-content">
                            NDWI helps detect water content in vegetation and identify water bodies.
                            NDWI helps detect water content in vegetation and identify water bodies.
                        </p>
                    </div>
                    <canvas id="ndwiChart"></canvas>
                </div>
                <div class="ndmiChartDiv">
                    <div class="chart-info">
                        <h3 id="ndmi-chart-title">NDMI - Normalized Difference Moisture Index</h3>
                        <p class="chart-info-content">
                            NDWI helps detect water content in vegetation and identify water bodies.
                            NDWI helps detect water content in vegetation and identify water bodies.
                        </p>
                    </div>
                    <canvas id="ndmiChart"></canvas>
                </div>
                <div class="lswiChartDiv">
                    <div class="chart-info">
                        <h3 id="lswi-chart-title">LSWI - Land Surface Water Index</h3>
                        <p class="chart-info-content">
                            NDWI helps detect water content in vegetation and identify water bodies.
                            NDWI helps detect water content in vegetation and identify water bodies.
                        </p>
                    </div>
                    <canvas id="lswiChart"></canvas>
                </div>
                <div class="aweiChartDiv">
                    <div class="chart-info">
                        <h3 id="awei-chart-title">AWEI - Automated Water Extraction Index</h3>
                        <p class="chart-info-content">
                            NDWI helps detect water content in vegetation and identify water bodies.
                            NDWI helps detect water content in vegetation and identify water bodies.
                        </p>
                    </div>
                    <canvas id="aweiChart"></canvas>
                </div>
            </div>
            <div class="observ">
                <h3 id="observ-head">Observations</h3>
            </div>
        </div>
    `;

    Papa.parse("ndwi.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const labels = results.data.map(row => row.date);
            const ndwiValues = results.data.map(row => parseFloat(row.ndwi));

            const ctx = document.getElementById('ndwiChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'NDWI',
                        data: ndwiValues,
                        borderColor: '#0080ffff',
                        fill: true
                    }]
                }
            });
        }
    });

    Papa.parse("ndmi.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const labels = results.data.map(row => row.date);
            const ndmiValues = results.data.map(row => parseFloat(row.ndmi));

            const ctx = document.getElementById('ndmiChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'NDMI',
                        data: ndmiValues,
                        borderColor: '#0080ffff',
                        fill: true
                    }]
                }
            });
        }
    });

    Papa.parse("lswi.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const labels = results.data.map(row => row.date);
            const lswiValues = results.data.map(row => parseFloat(row.lswi));

            const ctx = document.getElementById('lswiChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'LSWI',
                        data: lswiValues,
                        borderColor: '#0080ffff',
                        fill: true
                    }]
                }
            });
        }
    });

    Papa.parse("awei.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const labels = results.data.map(row => row.date);
            const aweiValues = results.data.map(row => parseFloat(row.awei));

            const ctx = document.getElementById('aweiChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'AWEI',
                        data: aweiValues,
                        borderColor: '#0080ffff',
                        fill: true
                    }]
                }
            });
        }
    });
}

function vegetation() {
    document.querySelector('.Analytics').innerHTML = `
        <div class="title">
            <i id="carrot" class="fa-solid fa-carrot"></i>
            <h2 id="vegetation_head">Vegetation & Crop Health</h2>
            <div class="IntervalRange">
                <p id="Interval">Interval:</p>
                <input type="date" id="startDate">
                <p id="to">to</p>
                <input type="date" id="endDate">
            </div>
        </div>
        <div class="vegSection">
            <div class="veg-container">
                <div class="ndviChartDiv">
                    <div class="chart-info">
                        <h3 id="ndvi-chart-title">NDVI - Normalized Difference Vegetation Index</h3>
                        <p class="chart-info-content">
                            NDWI helps detect water content in vegetation and identify water bodies.
                            NDWI helps detect water content in vegetation and identify water bodies.
                        </p>
                    </div>
                    <canvas id="ndviChart"></canvas>
                </div>
                <div class="eviChartDiv">
                    <div class="chart-info">
                        <h3 id="evi-chart-title">EVI - Enhanced Vegetation Index</h3>
                        <p class="chart-info-content">
                            NDWI helps detect water content in vegetation and identify water bodies.
                            NDWI helps detect water content in vegetation and identify water bodies.
                        </p>
                    </div>
                    <canvas id="eviChart"></canvas>
                </div>
                <div class="gciChartDiv">
                    <div class="chart-info">
                        <h3 id="gci-chart-title">GCI - Green Chlorophyll Index</h3>
                        <p class="chart-info-content">
                            NDWI helps detect water content in vegetation and identify water bodies.
                            NDWI helps detect water content in vegetation and identify water bodies.
                        </p>
                    </div>
                    <canvas id="gciChart"></canvas>
                </div>
                <div class="psriChartDiv">
                    <div class="chart-info">
                        <h3 id="psri-chart-title">PSRI - Plant Senescence Reflectance Index</h3>
                        <p class="chart-info-content">
                            NDWI helps detect water content in vegetation and identify water bodies.
                            NDWI helps detect water content in vegetation and identify water bodies.
                        </p>
                    </div>
                    <canvas id="psriChart"></canvas>
                </div>
                <div class="ndreChartDiv">
                    <div class="chart-info">
                        <h3 id="ndre-chart-title">NDRE - Normalized Difference Red Edge Index</h3>
                        <p class="chart-info-content">
                            NDWI helps detect water content in vegetation and identify water bodies.
                            NDWI helps detect water content in vegetation and identify water bodies.
                        </p>
                    </div>
                    <canvas id="ndreChart"></canvas>
                </div>
                <div class="cri1ChartDiv">
                    <div class="chart-info">
                        <h3 id="cri1-chart-title">CRI1 - Carotenoid Reflectance Index 1</h3>
                        <p class="chart-info-content">
                            NDWI helps detect water content in vegetation and identify water bodies.
                            NDWI helps detect water content in vegetation and identify water bodies.
                        </p>
                    </div>
                    <canvas id="cri1Chart"></canvas>
                </div>
                
            </div>
            <div class="observ">
                <h3 id="observ-head">Observations</h3>
            </div>
        </div>
    `;

    Papa.parse("ndvi.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const labels = results.data.map(row => row.date);
            const ndviValues = results.data.map(row => parseFloat(row.ndvi));

            const ctx = document.getElementById('ndviChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'NDVI',
                        data: ndviValues,
                        borderColor: 'green',
                        fill: true
                    }]
                }
            });
        }
    });

    Papa.parse("evi.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const labels = results.data.map(row => row.date);
            const eviValues = results.data.map(row => parseFloat(row.evi));

            const ctx = document.getElementById('eviChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'EVI',
                        data: eviValues,
                        borderColor: 'green',
                        fill: true
                    }]
                }
            });
        }
    });

    Papa.parse("gci.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const labels = results.data.map(row => row.date);
            const gciValues = results.data.map(row => parseFloat(row.gci));

            const ctx = document.getElementById('gciChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'GCI',
                        data: gciValues,
                        borderColor: 'green',
                        fill: true
                    }]
                }
            });
        }
    });

    Papa.parse("psri.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const labels = results.data.map(row => row.date);
            const psriValues = results.data.map(row => parseFloat(row.psri));

            const ctx = document.getElementById('psriChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'PSRI',
                        data: psriValues,
                        borderColor: 'green',
                        fill: true
                    }]
                }
            });
        }
    });

    Papa.parse("ndre.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const labels = results.data.map(row => row.date);
            const ndreValues = results.data.map(row => parseFloat(row.ndre));

            const ctx = document.getElementById('ndreChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'NDRE',
                        data: ndreValues,
                        borderColor: 'green',
                        fill: true
                    }]
                }
            });
        }
    });
    Papa.parse("cri1.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const labels = results.data.map(row => row.date);
            const cri1Values = results.data.map(row => parseFloat(row.cri1));

            const ctx = document.getElementById('cri1Chart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'CRI1',
                        data: cri1Values,
                        borderColor: 'green',
                        fill: true
                    }]
                }
            });
        }
    });
}

function fire(){
    document.querySelector('.Analytics').innerHTML = `
        <div class="title">
            <i id="fire" class="fa-solid fa-fire"></i>
            <h2 id="fire_head">Fire & Hazards</h2>
            <div class="IntervalRange">
                <p id="Interval">Interval:</p>
                <input type="date" id="startDate">
                <p id="to">to</p>
                <input type="date" id="endDate">
            </div>
        </div>
        <div class="fireSection">
            <div class="observ">
                <h3 id="observ-head">Observations</h3>
            </div>
        </div>
    `;
}

function rain(){
    document.querySelector('.Analytics').innerHTML = `
        <div class="title">
            <i id="rain" class="fa-solid fa-cloud-rain"></i>
            <h2 id="rain_head">Rainfall & Monsoon</h2>
            <div class="IntervalRange">
                <p id="Interval">Interval:</p>
                <input type="date" id="startDate">
                <p id="to">to</p>
                <input type="date" id="endDate">
            </div>
        </div>
        <div class="rainSection">
            <div class="observ">
                <h3 id="observ-head">Observations</h3>
            </div>
        </div>
    `;
}

function soil(){
    document.querySelector('.Analytics').innerHTML = `
        <div class="title">
            <i id="soil" class="fa-solid fa-seedling"></i>
            <h2 id="soil_head">Soil & Land</h2>
            <div class="IntervalRange">
                <p id="Interval">Interval:</p>
                <input type="date" id="startDate">
                <p id="to">to</p>
                <input type="date" id="endDate">
            </div>
        </div>
        <div class="soilSection">
            <div class="observ">
                <h3 id="observ-head">Observations</h3>
            </div>
        </div>
    `;
}