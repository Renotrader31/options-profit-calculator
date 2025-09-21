/**
 * Options Strategies Implementation
 * Handles all major options trading strategies and their profit/loss calculations
 */

class OptionsStrategies {
    /**
     * Strategy definitions with their parameters and descriptions
     */
    static strategies = {
        'long-call': {
            name: 'Long Call',
            description: 'Buy a call option. Bullish strategy with unlimited upside potential and limited downside risk.',
            complexity: 'beginner',
            riskLevel: 'low',
            legs: [
                { action: 'buy', type: 'call', quantity: 1 }
            ]
        },
        'long-put': {
            name: 'Long Put',
            description: 'Buy a put option. Bearish strategy with high profit potential and limited downside risk.',
            complexity: 'beginner',
            riskLevel: 'low',
            legs: [
                { action: 'buy', type: 'put', quantity: 1 }
            ]
        },
        'short-call': {
            name: 'Short Call',
            description: 'Sell a call option. Bearish/neutral strategy with limited profit and unlimited risk.',
            complexity: 'intermediate',
            riskLevel: 'high',
            legs: [
                { action: 'sell', type: 'call', quantity: 1 }
            ]
        },
        'short-put': {
            name: 'Short Put',
            description: 'Sell a put option. Bullish/neutral strategy with limited profit and high risk.',
            complexity: 'intermediate',
            riskLevel: 'high',
            legs: [
                { action: 'sell', type: 'put', quantity: 1 }
            ]
        },
        'bull-call-spread': {
            name: 'Bull Call Spread',
            description: 'Buy lower strike call, sell higher strike call. Limited risk and limited reward bullish strategy.',
            complexity: 'intermediate',
            riskLevel: 'medium',
            legs: [
                { action: 'buy', type: 'call', quantity: 1, strikeOffset: 0 },
                { action: 'sell', type: 'call', quantity: 1, strikeOffset: 5 }
            ]
        },
        'bear-call-spread': {
            name: 'Bear Call Spread',
            description: 'Sell lower strike call, buy higher strike call. Limited risk and limited reward bearish strategy.',
            complexity: 'intermediate',
            riskLevel: 'medium',
            legs: [
                { action: 'sell', type: 'call', quantity: 1, strikeOffset: 0 },
                { action: 'buy', type: 'call', quantity: 1, strikeOffset: 5 }
            ]
        },
        'bull-put-spread': {
            name: 'Bull Put Spread',
            description: 'Sell higher strike put, buy lower strike put. Limited risk and limited reward bullish strategy.',
            complexity: 'intermediate',
            riskLevel: 'medium',
            legs: [
                { action: 'sell', type: 'put', quantity: 1, strikeOffset: 0 },
                { action: 'buy', type: 'put', quantity: 1, strikeOffset: -5 }
            ]
        },
        'bear-put-spread': {
            name: 'Bear Put Spread',
            description: 'Buy higher strike put, sell lower strike put. Limited risk and limited reward bearish strategy.',
            complexity: 'intermediate',
            riskLevel: 'medium',
            legs: [
                { action: 'buy', type: 'put', quantity: 1, strikeOffset: 0 },
                { action: 'sell', type: 'put', quantity: 1, strikeOffset: -5 }
            ]
        },
        'long-straddle': {
            name: 'Long Straddle',
            description: 'Buy call and put at same strike. Profits from high volatility in either direction.',
            complexity: 'intermediate',
            riskLevel: 'medium',
            legs: [
                { action: 'buy', type: 'call', quantity: 1 },
                { action: 'buy', type: 'put', quantity: 1 }
            ]
        },
        'short-straddle': {
            name: 'Short Straddle',
            description: 'Sell call and put at same strike. Profits from low volatility but has unlimited risk.',
            complexity: 'advanced',
            riskLevel: 'high',
            legs: [
                { action: 'sell', type: 'call', quantity: 1 },
                { action: 'sell', type: 'put', quantity: 1 }
            ]
        },
        'long-strangle': {
            name: 'Long Strangle',
            description: 'Buy call and put at different strikes. Profits from high volatility, lower cost than straddle.',
            complexity: 'intermediate',
            riskLevel: 'medium',
            legs: [
                { action: 'buy', type: 'call', quantity: 1, strikeOffset: 5 },
                { action: 'buy', type: 'put', quantity: 1, strikeOffset: -5 }
            ]
        },
        'short-strangle': {
            name: 'Short Strangle',
            description: 'Sell call and put at different strikes. Profits from low volatility, unlimited risk.',
            complexity: 'advanced',
            riskLevel: 'high',
            legs: [
                { action: 'sell', type: 'call', quantity: 1, strikeOffset: 5 },
                { action: 'sell', type: 'put', quantity: 1, strikeOffset: -5 }
            ]
        },
        'iron-condor': {
            name: 'Iron Condor',
            description: 'Sell call spread and put spread. Profits from low volatility with defined risk.',
            complexity: 'advanced',
            riskLevel: 'medium',
            legs: [
                { action: 'buy', type: 'put', quantity: 1, strikeOffset: -10 },
                { action: 'sell', type: 'put', quantity: 1, strikeOffset: -5 },
                { action: 'sell', type: 'call', quantity: 1, strikeOffset: 5 },
                { action: 'buy', type: 'call', quantity: 1, strikeOffset: 10 }
            ]
        },
        'butterfly': {
            name: 'Butterfly Spread',
            description: 'Buy two options at outer strikes, sell two at middle strike. Low risk, low reward.',
            complexity: 'advanced',
            riskLevel: 'low',
            legs: [
                { action: 'buy', type: 'call', quantity: 1, strikeOffset: -5 },
                { action: 'sell', type: 'call', quantity: 2, strikeOffset: 0 },
                { action: 'buy', type: 'call', quantity: 1, strikeOffset: 5 }
            ]
        },
        'covered-call': {
            name: 'Covered Call',
            description: 'Own 100 shares and sell a call. Conservative income strategy with limited upside.',
            complexity: 'beginner',
            riskLevel: 'low',
            legs: [
                { action: 'own', type: 'stock', quantity: 100 },
                { action: 'sell', type: 'call', quantity: 1 }
            ]
        },
        'protective-put': {
            name: 'Protective Put',
            description: 'Own 100 shares and buy a put. Insurance strategy to protect against downside.',
            complexity: 'beginner',
            riskLevel: 'low',
            legs: [
                { action: 'own', type: 'stock', quantity: 100 },
                { action: 'buy', type: 'put', quantity: 1 }
            ]
        }
    };

    /**
     * Get strategy configuration
     * @param {string} strategyKey - Strategy identifier
     * @returns {Object} - Strategy configuration
     */
    static getStrategy(strategyKey) {
        return this.strategies[strategyKey] || null;
    }

    /**
     * Calculate profit/loss for a strategy at a given stock price
     * @param {Object} strategy - Strategy configuration
     * @param {Array} legs - Array of option legs with strikes and premiums
     * @param {number} stockPrice - Stock price to evaluate
     * @param {number} timeToExpiry - Time to expiry (0 for expiration, > 0 for current value)
     * @returns {number} - Total profit/loss
     */
    static calculateProfitLoss(strategy, legs, stockPrice, timeToExpiry = 0) {
        let totalPL = 0;

        legs.forEach((leg, index) => {
            const strategyLeg = strategy.legs[index];
            if (!strategyLeg) return;

            let legPL = 0;

            if (strategyLeg.type === 'stock') {
                // Stock position
                if (strategyLeg.action === 'own') {
                    legPL = (stockPrice - leg.costBasis) * strategyLeg.quantity;
                }
            } else {
                // Options position
                let optionValue = 0;

                if (timeToExpiry === 0) {
                    // At expiration - intrinsic value only
                    if (strategyLeg.type === 'call') {
                        optionValue = Math.max(stockPrice - leg.strike, 0);
                    } else {
                        optionValue = Math.max(leg.strike - stockPrice, 0);
                    }
                } else {
                    // Current value using Black-Scholes
                    optionValue = BlackScholes.getOptionPrice({
                        type: strategyLeg.type,
                        strike: leg.strike,
                        timeToExpiry: timeToExpiry,
                        riskFreeRate: leg.riskFreeRate || 0.05,
                        volatility: leg.volatility || 0.25
                    }, stockPrice, timeToExpiry);
                }

                if (strategyLeg.action === 'buy') {
                    legPL = (optionValue - leg.premium) * strategyLeg.quantity * 100;
                } else if (strategyLeg.action === 'sell') {
                    legPL = (leg.premium - optionValue) * strategyLeg.quantity * 100;
                }
            }

            totalPL += legPL;
        });

        return totalPL;
    }

    /**
     * Calculate profit/loss for multiple stock prices
     * @param {Object} strategy - Strategy configuration
     * @param {Array} legs - Array of option legs
     * @param {Array} stockPrices - Array of stock prices
     * @param {number} timeToExpiry - Time to expiry
     * @returns {Array} - Array of profit/loss values
     */
    static calculateProfitLossArray(strategy, legs, stockPrices, timeToExpiry = 0) {
        return stockPrices.map(price => this.calculateProfitLoss(strategy, legs, price, timeToExpiry));
    }

    /**
     * Find breakeven points for a strategy
     * @param {Object} strategy - Strategy configuration
     * @param {Array} legs - Array of option legs
     * @param {number} currentPrice - Current stock price
     * @returns {Array} - Array of breakeven prices
     */
    static findBreakevens(strategy, legs, currentPrice) {
        const breakevens = [];
        const priceRange = this.generatePriceRange(currentPrice);
        const profits = this.calculateProfitLossArray(strategy, legs, priceRange, 0);

        for (let i = 1; i < profits.length; i++) {
            if ((profits[i-1] <= 0 && profits[i] >= 0) || (profits[i-1] >= 0 && profits[i] <= 0)) {
                // Linear interpolation to find more precise breakeven
                const ratio = Math.abs(profits[i-1]) / (Math.abs(profits[i-1]) + Math.abs(profits[i]));
                const breakeven = priceRange[i-1] + ratio * (priceRange[i] - priceRange[i-1]);
                breakevens.push(breakeven);
            }
        }

        return breakevens;
    }

    /**
     * Calculate maximum profit for a strategy
     * @param {Object} strategy - Strategy configuration
     * @param {Array} legs - Array of option legs
     * @param {number} currentPrice - Current stock price
     * @returns {number} - Maximum profit (or Infinity if unlimited)
     */
    static calculateMaxProfit(strategy, legs, currentPrice) {
        const priceRange = this.generatePriceRange(currentPrice, 2);
        const profits = this.calculateProfitLossArray(strategy, legs, priceRange, 0);
        
        const maxProfit = Math.max(...profits);
        
        // Check if profit continues to increase at the edges (unlimited profit)
        if (profits[profits.length - 1] > profits[profits.length - 2] && 
            profits[profits.length - 1] === maxProfit) {
            return Infinity;
        }
        
        return maxProfit;
    }

    /**
     * Calculate maximum loss for a strategy
     * @param {Object} strategy - Strategy configuration
     * @param {Array} legs - Array of option legs
     * @param {number} currentPrice - Current stock price
     * @returns {number} - Maximum loss (or -Infinity if unlimited)
     */
    static calculateMaxLoss(strategy, legs, currentPrice) {
        const priceRange = this.generatePriceRange(currentPrice, 2);
        const profits = this.calculateProfitLossArray(strategy, legs, priceRange, 0);
        
        const maxLoss = Math.min(...profits);
        
        // Check if loss continues to increase at the edges (unlimited loss)
        if ((profits[0] < profits[1] && profits[0] === maxLoss) ||
            (profits[profits.length - 1] < profits[profits.length - 2] && profits[profits.length - 1] === maxLoss)) {
            return -Infinity;
        }
        
        return maxLoss;
    }

    /**
     * Generate a range of stock prices for analysis
     * @param {number} currentPrice - Current stock price
     * @param {number} rangeFactor - Factor to determine price range (default 1.5)
     * @returns {Array} - Array of stock prices
     */
    static generatePriceRange(currentPrice, rangeFactor = 1.5) {
        const minPrice = currentPrice * (2 - rangeFactor);
        const maxPrice = currentPrice * rangeFactor;
        const step = (maxPrice - minPrice) / 200;
        
        const prices = [];
        for (let price = minPrice; price <= maxPrice; price += step) {
            prices.push(Math.round(price * 100) / 100);
        }
        
        return prices;
    }

    /**
     * Calculate total premium paid/received for a strategy
     * @param {Object} strategy - Strategy configuration
     * @param {Array} legs - Array of option legs
     * @returns {number} - Net premium (positive if paid, negative if received)
     */
    static calculateNetPremium(strategy, legs) {
        let netPremium = 0;

        legs.forEach((leg, index) => {
            const strategyLeg = strategy.legs[index];
            if (!strategyLeg || strategyLeg.type === 'stock') return;

            if (strategyLeg.action === 'buy') {
                netPremium += leg.premium * strategyLeg.quantity * 100;
            } else if (strategyLeg.action === 'sell') {
                netPremium -= leg.premium * strategyLeg.quantity * 100;
            }
        });

        return netPremium;
    }

    /**
     * Generate default leg parameters based on strategy and current price
     * @param {string} strategyKey - Strategy identifier
     * @param {number} currentPrice - Current stock price
     * @param {Object} marketParams - Market parameters (volatility, rate, etc.)
     * @returns {Array} - Array of leg parameters
     */
    static generateDefaultLegs(strategyKey, currentPrice, marketParams) {
        const strategy = this.getStrategy(strategyKey);
        if (!strategy) return [];

        const legs = [];
        const timeToExpiry = marketParams.daysToExpiration / 365;

        strategy.legs.forEach(strategyLeg => {
            const leg = {
                action: strategyLeg.action,
                type: strategyLeg.type,
                quantity: strategyLeg.quantity,
                riskFreeRate: marketParams.riskFreeRate / 100,
                volatility: marketParams.volatility / 100
            };

            if (strategyLeg.type === 'stock') {
                leg.costBasis = currentPrice;
            } else {
                // Calculate strike price
                const strikeOffset = strategyLeg.strikeOffset || 0;
                leg.strike = Math.round(currentPrice + strikeOffset);

                // Calculate premium using Black-Scholes
                leg.premium = BlackScholes.getOptionPrice({
                    type: strategyLeg.type,
                    strike: leg.strike,
                    timeToExpiry: timeToExpiry,
                    riskFreeRate: leg.riskFreeRate,
                    volatility: leg.volatility
                }, currentPrice, timeToExpiry);

                leg.premium = Math.round(leg.premium * 100) / 100;
            }

            legs.push(leg);
        });

        return legs;
    }

    /**
     * Validate strategy configuration
     * @param {Object} strategy - Strategy configuration
     * @param {Array} legs - Array of option legs
     * @returns {Object} - Validation result with isValid flag and errors array
     */
    static validateStrategy(strategy, legs) {
        const errors = [];
        
        if (!strategy) {
            errors.push('Invalid strategy selected');
            return { isValid: false, errors };
        }

        if (legs.length !== strategy.legs.length) {
            errors.push('Number of legs does not match strategy requirements');
        }

        legs.forEach((leg, index) => {
            const strategyLeg = strategy.legs[index];
            if (!strategyLeg) return;

            if (strategyLeg.type !== 'stock') {
                if (!leg.strike || leg.strike <= 0) {
                    errors.push(`Leg ${index + 1}: Invalid strike price`);
                }
                if (!leg.premium || leg.premium < 0) {
                    errors.push(`Leg ${index + 1}: Invalid premium`);
                }
            }
        });

        return { isValid: errors.length === 0, errors };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptionsStrategies;
}
