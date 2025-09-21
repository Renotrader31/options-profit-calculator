/**
 * Chart Manager for Options Profit Calculator
 * Handles all chart visualization using Chart.js
 */

class ChartManager {
    constructor() {
        this.chart = null;
        this.chartCanvas = null;
        this.currentData = null;
        this.showCurrentValue = true;
    }

    /**
     * Initialize the chart
     * @param {string} canvasId - ID of the canvas element
     */
    initialize(canvasId) {
        this.chartCanvas = document.getElementById(canvasId);
        if (!this.chartCanvas) {
            console.error('Chart canvas not found');
            return;
        }

        this.createChart();
    }

    /**
     * Create the Chart.js instance
     */
    createChart() {
        const ctx = this.chartCanvas.getContext('2d');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Profit/Loss Chart',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(59, 130, 246, 0.8)',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                const formatted = this.formatCurrency(value);
                                return `${context.dataset.label}: ${formatted}`;
                            },
                            title: (contexts) => {
                                if (contexts && contexts.length > 0) {
                                    const price = contexts[0].parsed.x;
                                    return `Stock Price: $${price.toFixed(2)}`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Stock Price ($)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Profit/Loss ($)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0.1
                    },
                    point: {
                        radius: 0,
                        hoverRadius: 6
                    }
                },
                onHover: (event, elements) => {
                    event.native.target.style.cursor = elements.length > 0 ? 'crosshair' : 'default';
                }
            }
        });

        // Add zero line
        this.addZeroLine();
    }

    /**
     * Add horizontal line at y = 0
     */
    addZeroLine() {
        if (!this.chart) return;

        const zeroLinePlugin = {
            id: 'zeroLine',
            beforeDraw: (chart) => {
                const ctx = chart.ctx;
                const chartArea = chart.chartArea;
                const yScale = chart.scales.y;
                
                const zeroY = yScale.getPixelForValue(0);
                
                if (zeroY >= chartArea.top && zeroY <= chartArea.bottom) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(chartArea.left, zeroY);
                    ctx.lineTo(chartArea.right, zeroY);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        };

        Chart.register(zeroLinePlugin);
    }

    /**
     * Update chart with new data
     * @param {Object} data - Chart data object
     */
    updateChart(data) {
        if (!this.chart || !data) return;

        this.currentData = data;
        
        const datasets = [];

        // Add expiration P&L line
        if (data.expirationPL && data.stockPrices) {
            datasets.push({
                label: 'P&L at Expiration',
                data: data.stockPrices.map((price, index) => ({
                    x: price,
                    y: data.expirationPL[index] || 0
                })),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: false,
                tension: 0.1,
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 6
            });
        }

        // Add current value P&L line if enabled
        if (this.showCurrentValue && data.currentPL && data.stockPrices) {
            datasets.push({
                label: 'Current P&L',
                data: data.stockPrices.map((price, index) => ({
                    x: price,
                    y: data.currentPL[index] || 0
                })),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: false,
                tension: 0.1,
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                pointHoverRadius: 6
            });
        }

        // Add breakeven vertical lines
        if (data.breakevens && data.breakevens.length > 0) {
            data.breakevens.forEach((breakeven, index) => {
                const yMin = Math.min(...(data.expirationPL || [0]));
                const yMax = Math.max(...(data.expirationPL || [0]));
                
                datasets.push({
                    label: index === 0 ? 'Breakeven' : '',
                    data: [
                        { x: breakeven, y: yMin },
                        { x: breakeven, y: yMax }
                    ],
                    borderColor: '#F59E0B',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [10, 5],
                    pointRadius: 0,
                    showLine: true,
                    fill: false,
                    tension: 0
                });
            });
        }

        // Add current stock price line
        if (data.currentStockPrice) {
            const yMin = Math.min(...(data.expirationPL || [0]));
            const yMax = Math.max(...(data.expirationPL || [0]));
            
            datasets.push({
                label: 'Current Price',
                data: [
                    { x: data.currentStockPrice, y: yMin },
                    { x: data.currentStockPrice, y: yMax }
                ],
                borderColor: '#EF4444',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                showLine: true,
                fill: false,
                tension: 0
            });
        }

        this.chart.data.datasets = datasets;
        this.chart.update('none'); // Fast update without animation
    }

    /**
     * Toggle between showing current value and expiration only
     * @param {boolean} showCurrent - Whether to show current value line
     */
    toggleCurrentValue(showCurrent) {
        this.showCurrentValue = showCurrent;
        if (this.currentData) {
            this.updateChart(this.currentData);
        }
    }

    /**
     * Format currency for display
     * @param {number} value - Currency value
     * @returns {string} - Formatted currency string
     */
    formatCurrency(value) {
        if (Math.abs(value) === Infinity) {
            return value > 0 ? '+∞' : '-∞';
        }
        
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        return formatter.format(value);
    }

    /**
     * Get profit/loss color based on value
     * @param {number} value - P&L value
     * @returns {string} - CSS color class
     */
    getPLColor(value) {
        if (value > 0) return 'text-green-600';
        if (value < 0) return 'text-red-600';
        return 'text-yellow-600';
    }

    /**
     * Highlight specific data points on the chart
     * @param {Array} points - Array of {x, y} points to highlight
     */
    highlightPoints(points) {
        if (!this.chart || !points || points.length === 0) return;

        const highlightDataset = {
            label: 'Highlights',
            data: points.map(point => ({ x: point.x, y: point.y })),
            borderColor: '#8B5CF6',
            backgroundColor: '#8B5CF6',
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false,
            fill: false
        };

        this.chart.data.datasets.push(highlightDataset);
        this.chart.update();
    }

    /**
     * Export chart as image
     * @param {string} filename - Filename for the exported image
     */
    exportChart(filename = 'options-chart.png') {
        if (!this.chart) return;

        const link = document.createElement('a');
        link.href = this.chart.toBase64Image();
        link.download = filename;
        link.click();
    }

    /**
     * Resize chart to fit container
     */
    resize() {
        if (this.chart) {
            this.chart.resize();
        }
    }

    /**
     * Destroy chart instance
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    /**
     * Update chart theme
     * @param {string} theme - 'light' or 'dark'
     */
    updateTheme(theme) {
        if (!this.chart) return;

        const isDark = theme === 'dark';
        const textColor = isDark ? '#F9FAFB' : '#374151';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        this.chart.options.scales.x.title.color = textColor;
        this.chart.options.scales.y.title.color = textColor;
        this.chart.options.scales.x.ticks.color = textColor;
        this.chart.options.scales.y.ticks.color = textColor;
        this.chart.options.scales.x.grid.color = gridColor;
        this.chart.options.scales.y.grid.color = gridColor;
        this.chart.options.plugins.title.color = textColor;
        this.chart.options.plugins.legend.labels.color = textColor;

        this.chart.update();
    }

    /**
     * Add animation to chart updates
     * @param {string} animationType - Type of animation ('slide', 'fade', etc.)
     */
    setAnimation(animationType = 'slide') {
        if (!this.chart) return;

        const animations = {
            slide: {
                x: {
                    type: 'number',
                    easing: 'easeOutQuart',
                    duration: 750,
                    from: NaN,
                    delay: (ctx) => ctx.index * 50
                },
                y: {
                    type: 'number',
                    easing: 'easeOutQuart',
                    duration: 750,
                    from: 0,
                    delay: (ctx) => ctx.index * 50
                }
            },
            fade: {
                opacity: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        };

        this.chart.options.animation = animations[animationType] || animations.slide;
        this.chart.update();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}
