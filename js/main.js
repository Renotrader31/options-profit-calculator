/**
 * Main Application for Options Profit Calculator
 * Coordinates UI interactions, calculations, and chart updates
 */

class OptionsCalculatorApp {
    constructor() {
        this.chartManager = new ChartManager();
        this.currentStrategy = null;
        this.currentLegs = [];
        this.marketParams = {
            currentPrice: 100,
            volatility: 25,
            riskFreeRate: 5,
            daysToExpiration: 30
        };
        
        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        this.bindEventListeners();
        this.initializeChart();
        this.loadDefaultStrategy();
        this.updateCalculations();
    }

    /**
     * Bind all event listeners
     */
    bindEventListeners() {
        // Strategy selection
        document.getElementById('strategySelect').addEventListener('change', (e) => {
            this.onStrategyChange(e.target.value);
        });

        // Market parameter inputs
        ['currentPrice', 'volatility', 'riskFreeRate', 'daysToExpiration'].forEach(param => {
            const element = document.getElementById(param);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.onMarketParamChange(param, parseFloat(e.target.value) || 0);
                });
            }
        });

        // Calculate button
        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.updateCalculations();
        });

        // Chart toggle buttons
        document.getElementById('toggleExpiry').addEventListener('click', () => {
            this.toggleChartView(false);
        });

        document.getElementById('toggleCurrent').addEventListener('click', () => {
            this.toggleChartView(true);
        });

        // Auto-calculation on input changes
        document.addEventListener('input', (e) => {
            if (e.target.closest('.options-leg')) {
                this.debouncedUpdate();
            }
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.chartManager.resize();
        });
    }

    /**
     * Initialize the chart
     */
    initializeChart() {
        this.chartManager.initialize('profitChart');
    }

    /**
     * Load default strategy
     */
    loadDefaultStrategy() {
        this.onStrategyChange('long-call');
    }

    /**
     * Handle strategy selection change
     * @param {string} strategyKey - Selected strategy key
     */
    onStrategyChange(strategyKey) {
        const strategy = OptionsStrategies.getStrategy(strategyKey);
        if (!strategy) return;

        this.currentStrategy = strategy;
        this.updateStrategyDescription(strategy);
        this.generateStrategyLegs(strategyKey);
        this.updateCalculations();
    }

    /**
     * Handle market parameter changes
     * @param {string} param - Parameter name
     * @param {number} value - New value
     */
    onMarketParamChange(param, value) {
        this.marketParams[param] = value;
        
        // Regenerate legs with new market parameters
        if (this.currentStrategy) {
            const strategyKey = document.getElementById('strategySelect').value;
            this.generateStrategyLegs(strategyKey);
        }
        
        this.debouncedUpdate();
    }

    /**
     * Update strategy description
     * @param {Object} strategy - Strategy object
     */
    updateStrategyDescription(strategy) {
        const descriptionElement = document.getElementById('strategyText');
        if (descriptionElement) {
            descriptionElement.innerHTML = `
                <strong>${strategy.name}</strong><br>
                ${strategy.description}<br>
                <div class="mt-2 flex items-center space-x-4">
                    <span class="complexity-${strategy.complexity}">
                        <i class="fas fa-layer-group mr-1"></i>${strategy.complexity.charAt(0).toUpperCase() + strategy.complexity.slice(1)}
                    </span>
                    <span class="risk-${strategy.riskLevel}">
                        <i class="fas fa-exclamation-triangle mr-1"></i>Risk: ${strategy.riskLevel.charAt(0).toUpperCase() + strategy.riskLevel.slice(1)}
                    </span>
                </div>
            `;
        }
    }

    /**
     * Generate strategy legs UI
     * @param {string} strategyKey - Strategy key
     */
    generateStrategyLegs(strategyKey) {
        const strategy = OptionsStrategies.getStrategy(strategyKey);
        if (!strategy) return;

        // Generate default legs
        this.currentLegs = OptionsStrategies.generateDefaultLegs(
            strategyKey, 
            this.marketParams.currentPrice, 
            this.marketParams
        );

        const container = document.getElementById('optionsLegs');
        container.innerHTML = '';

        this.currentLegs.forEach((leg, index) => {
            const legElement = this.createLegElement(leg, index, strategy.legs[index]);
            container.appendChild(legElement);
        });
    }

    /**
     * Create a leg input element
     * @param {Object} leg - Leg data
     * @param {number} index - Leg index
     * @param {Object} strategyLeg - Strategy leg configuration
     * @returns {HTMLElement} - Leg element
     */
    createLegElement(leg, index, strategyLeg) {
        const div = document.createElement('div');
        div.className = 'options-leg';
        div.dataset.legIndex = index;

        let legHTML = `
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-800">
                    <i class="fas fa-${this.getLegIcon(strategyLeg)} mr-2"></i>
                    Leg ${index + 1}: ${this.getLegDescription(strategyLeg)}
                </h4>
                <span class="text-xs px-2 py-1 bg-gray-200 rounded">
                    ${strategyLeg.action.toUpperCase()} ${strategyLeg.quantity}x
                </span>
            </div>
        `;

        if (strategyLeg.type === 'stock') {
            legHTML += `
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Shares</label>
                        <input type="number" value="${strategyLeg.quantity}" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" readonly>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Cost Basis ($)</label>
                        <input type="number" id="costBasis_${index}" value="${leg.costBasis}" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    </div>
                </div>
            `;
        } else {
            legHTML += `
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Strike ($)</label>
                        <input type="number" id="strike_${index}" value="${leg.strike}" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Premium ($)</label>
                        <input type="number" id="premium_${index}" value="${leg.premium}" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    </div>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                    ${strategyLeg.type.charAt(0).toUpperCase() + strategyLeg.type.slice(1)} Option • 
                    IV: ${(leg.volatility * 100).toFixed(1)}% • 
                    ${this.marketParams.daysToExpiration} DTE
                </div>
            `;
        }

        div.innerHTML = legHTML;
        return div;
    }

    /**
     * Get icon for leg type
     * @param {Object} strategyLeg - Strategy leg configuration
     * @returns {string} - Icon class
     */
    getLegIcon(strategyLeg) {
        if (strategyLeg.type === 'stock') return 'chart-line';
        if (strategyLeg.type === 'call') return 'arrow-up';
        if (strategyLeg.type === 'put') return 'arrow-down';
        return 'circle';
    }

    /**
     * Get description for leg
     * @param {Object} strategyLeg - Strategy leg configuration
     * @returns {string} - Leg description
     */
    getLegDescription(strategyLeg) {
        if (strategyLeg.type === 'stock') {
            return `${strategyLeg.action === 'own' ? 'Own' : 'Short'} Stock`;
        }
        return `${strategyLeg.action === 'buy' ? 'Long' : 'Short'} ${strategyLeg.type.charAt(0).toUpperCase() + strategyLeg.type.slice(1)}`;
    }

    /**
     * Update all calculations and displays
     */
    updateCalculations() {
        this.updateLegsFromInputs();
        
        if (!this.currentStrategy || this.currentLegs.length === 0) return;

        // Validate strategy
        const validation = OptionsStrategies.validateStrategy(this.currentStrategy, this.currentLegs);
        if (!validation.isValid) {
            console.error('Strategy validation failed:', validation.errors);
            return;
        }

        // Generate price range for analysis
        const priceRange = OptionsStrategies.generatePriceRange(this.marketParams.currentPrice);
        const timeToExpiry = this.marketParams.daysToExpiration / 365;

        // Calculate profit/loss arrays
        const expirationPL = OptionsStrategies.calculateProfitLossArray(
            this.currentStrategy, this.currentLegs, priceRange, 0
        );
        
        const currentPL = OptionsStrategies.calculateProfitLossArray(
            this.currentStrategy, this.currentLegs, priceRange, timeToExpiry
        );

        // Calculate key metrics
        const maxProfit = OptionsStrategies.calculateMaxProfit(
            this.currentStrategy, this.currentLegs, this.marketParams.currentPrice
        );
        
        const maxLoss = OptionsStrategies.calculateMaxLoss(
            this.currentStrategy, this.currentLegs, this.marketParams.currentPrice
        );
        
        const breakevens = OptionsStrategies.findBreakevens(
            this.currentStrategy, this.currentLegs, this.marketParams.currentPrice
        );

        // Update displays
        this.updateMetricsCards({ maxProfit, maxLoss, breakevens });
        this.updateChart({ priceRange, expirationPL, currentPL, breakevens });
        this.updateStrategyTable();
    }

    /**
     * Update legs data from form inputs
     */
    updateLegsFromInputs() {
        this.currentLegs.forEach((leg, index) => {
            const strategyLeg = this.currentStrategy.legs[index];
            
            if (strategyLeg.type === 'stock') {
                const costBasisInput = document.getElementById(`costBasis_${index}`);
                if (costBasisInput) {
                    leg.costBasis = parseFloat(costBasisInput.value) || 0;
                }
            } else {
                const strikeInput = document.getElementById(`strike_${index}`);
                const premiumInput = document.getElementById(`premium_${index}`);
                
                if (strikeInput) {
                    leg.strike = parseFloat(strikeInput.value) || 0;
                }
                if (premiumInput) {
                    leg.premium = parseFloat(premiumInput.value) || 0;
                }
            }
        });
    }

    /**
     * Update metrics cards
     * @param {Object} metrics - Calculated metrics
     */
    updateMetricsCards(metrics) {
        const maxProfitEl = document.getElementById('maxProfit');
        const maxLossEl = document.getElementById('maxLoss');
        const breakevenEl = document.getElementById('breakeven');

        if (maxProfitEl) {
            maxProfitEl.textContent = this.formatCurrency(metrics.maxProfit);
            maxProfitEl.className = `text-2xl font-bold ${this.getPLColorClass(metrics.maxProfit)}`;
        }

        if (maxLossEl) {
            maxLossEl.textContent = this.formatCurrency(metrics.maxLoss);
            maxLossEl.className = `text-2xl font-bold ${this.getPLColorClass(metrics.maxLoss)}`;
        }

        if (breakevenEl) {
            if (metrics.breakevens.length === 0) {
                breakevenEl.textContent = 'None';
                breakevenEl.className = 'text-2xl font-bold text-gray-500';
            } else if (metrics.breakevens.length === 1) {
                breakevenEl.textContent = `$${metrics.breakevens[0].toFixed(2)}`;
                breakevenEl.className = 'text-2xl font-bold text-warning';
            } else {
                breakevenEl.textContent = `${metrics.breakevens.length} points`;
                breakevenEl.className = 'text-2xl font-bold text-warning';
                breakevenEl.title = metrics.breakevens.map(be => `$${be.toFixed(2)}`).join(', ');
            }
        }
    }

    /**
     * Update chart with new data
     * @param {Object} data - Chart data
     */
    updateChart(data) {
        const chartData = {
            stockPrices: data.priceRange,
            expirationPL: data.expirationPL,
            currentPL: data.currentPL,
            breakevens: data.breakevens,
            currentStockPrice: this.marketParams.currentPrice
        };

        this.chartManager.updateChart(chartData);
    }

    /**
     * Update strategy details table
     */
    updateStrategyTable() {
        const tbody = document.getElementById('strategyTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.currentLegs.forEach((leg, index) => {
            const strategyLeg = this.currentStrategy.legs[index];
            const row = tbody.insertRow();
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${index + 1}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getActionBadgeClass(strategyLeg.action)}">
                        ${strategyLeg.action.toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${strategyLeg.type.charAt(0).toUpperCase() + strategyLeg.type.slice(1)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${strategyLeg.type === 'stock' ? 'N/A' : `$${leg.strike}`}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${strategyLeg.type === 'stock' ? `$${leg.costBasis}` : `$${leg.premium}`}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${strategyLeg.quantity}</td>
            `;
        });
    }

    /**
     * Toggle chart view between current and expiry
     * @param {boolean} showCurrent - Show current value line
     */
    toggleChartView(showCurrent) {
        this.chartManager.toggleCurrentValue(showCurrent);
        
        // Update button states
        const expiryBtn = document.getElementById('toggleExpiry');
        const currentBtn = document.getElementById('toggleCurrent');
        
        if (showCurrent) {
            currentBtn.className = 'px-3 py-1 text-sm bg-primary text-white rounded hover:bg-blue-600 transition-colors';
            expiryBtn.className = 'px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors';
        } else {
            expiryBtn.className = 'px-3 py-1 text-sm bg-primary text-white rounded hover:bg-blue-600 transition-colors';
            currentBtn.className = 'px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors';
        }
    }

    /**
     * Get CSS class for profit/loss color
     * @param {number} value - P&L value
     * @returns {string} - CSS class
     */
    getPLColorClass(value) {
        if (value > 0) return 'text-success';
        if (value < 0) return 'text-danger';
        return 'text-warning';
    }

    /**
     * Get badge class for action
     * @param {string} action - Action type
     * @returns {string} - CSS class
     */
    getActionBadgeClass(action) {
        switch (action) {
            case 'buy': return 'bg-green-100 text-green-800';
            case 'sell': return 'bg-red-100 text-red-800';
            case 'own': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    /**
     * Format currency for display
     * @param {number} value - Currency value
     * @returns {string} - Formatted string
     */
    formatCurrency(value) {
        return this.chartManager.formatCurrency(value);
    }

    /**
     * Debounced update function
     */
    debouncedUpdate() {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            this.updateCalculations();
        }, 300);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OptionsCalculatorApp();
});
