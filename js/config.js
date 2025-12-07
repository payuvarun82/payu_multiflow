/**
 * PayU Integration Lab - Configuration
 * =====================================
 * Global variables, constants, and initialization logic
 */

// Global Variables
let currentFlow = '';
let currentPaymentType = 'onetime';
const DEFAULT_KEY = 'a4vGC2';
const DEFAULT_SALT = 'hKvGJP28d2ZUuCRz5BnDag58QBdCxBli';

// Split Payment counter
let splitRowCounter = 0;

// Bank Offers SKU counter
let boSkuRowCounter = 0;

// Code Generator state
let currentGeneratedLanguage = 'java';
let currentGeneratedFlow = '';
let currentGeneratedParams = {};

/**
 * URL ROUTING SYSTEM (Path-Based)
 * ================================
 * This application uses path-based routing for direct access to payment flows.
 * 
 * URL Format: https://your-domain.com/flowname
 * 
 * Examples:
 * - /crossborder     → Cross Border Payment
 * - /payu-hosted     → PayU Hosted Checkout (Pre-built Checkout)
 * - /subscription    → Subscription Payment
 * - /tpv             → TPV Payment
 * - /upiotm          → UPI OTM
 * - /preauth         → PreAuth Card Flow
 * - /checkoutplus    → Checkout Plus
 * - /split           → Split Payment
 * - /bankoffer       → Bank Offers
 * 
 * Deployment:
 * - Requires server configuration to route all paths to index.html
 * - Render: Use _redirects file (included in project)
 * - No landing page - each team gets their specific flow URL
 */

// Back Button Detection - Auto-refresh for new transaction ID
window.addEventListener('pageshow', function(event) {
    // Check if page was restored from browser cache (back/forward button)
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        console.log('⟲ Page restored from cache (back button) - Refreshing for new transaction ID');
        window.location.reload(true); // Force reload from server
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Page Loaded - Generating fresh transaction IDs for all flows');
    
    // Initialize transaction IDs for all flows
    generateTransactionId('crossborder');
    generateTransactionId('nonseamless');
    generateTransactionId('subscription');
    generateTransactionId('tpv');
    generateTransactionId('upiotm');
    generateTransactionId('preauth');
    generateTransactionId('checkoutplus');
    generateTransactionId('split');
    generateTransactionId('bankoffer');
    
    // Initialize Fill with Sample Data button visibility based on custom keys state
    const flows = ['crossborder', 'nonseamless', 'subscription', 'tpv', 'upiotm', 'preauth', 'checkoutplus', 'split', 'bankoffer'];
    flows.forEach(function(flow) {
        const prefix = getFlowPrefix(flow);
        const customKeysCheckbox = document.getElementById(prefix + '_use_custom_keys');
        const templateWrapper = document.getElementById(prefix + '-generate-template-wrapper');
        
        if (templateWrapper) {
            // Show button only if custom keys are NOT checked (predefined credentials)
            if (customKeysCheckbox && !customKeysCheckbox.checked) {
                templateWrapper.style.display = 'block';
            } else {
                templateWrapper.style.display = 'none';
            }
        }
    });
    
    // Set default values for subscription flows
    initializeSubscriptionDefaults();
    
    // Add validation listeners
    addValidationListeners();
    
    // Load flow from URL
    loadFlowFromURL();
    
    // Listen for hash changes
    window.addEventListener('hashchange', function() {
        console.log('=== Hash Changed ===');
        loadFlowFromURL();
    });
    
    // Initialize character counters for all fields with maxlength
    initializeCharCounters();
    
    // Initialize transaction ID field listeners (for custom credentials mode)
    initializeTxnidListeners();
    
    // Initialize button click tracking
    initializeButtonTracking();
});

/**
 * Get the element prefix for a flow
 * @param {string} flow - Flow identifier
 * @returns {string} Element ID prefix
 */
function getFlowPrefix(flow) {
    const prefixMap = {
        'crossborder': 'cb',
        'subscription': 'sub',
        'tpv': 'tpv',
        'upiotm': 'upi',
        'preauth': 'preauth',
        'checkoutplus': 'cp',
        'split': 'split',
        'bankoffer': 'bo',
        'nonseamless': 'ns'
    };
    return prefixMap[flow] || 'ns';
}

/**
 * Initialize subscription default values
 */
function initializeSubscriptionDefaults() {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('=== Initializing Subscription Fields on Page Load ===');
    console.log('Current date:', today);
    
    // Cross Border subscription defaults
    const cbPaymentStartDate = document.getElementById('cb_payment_start_date');
    const cbBillingInterval = document.getElementById('cb_billing_interval');
    
    if (cbPaymentStartDate) {
        cbPaymentStartDate.value = today;
        cbPaymentStartDate.min = today;
        console.log('✓ Cross Border payment_start_date set to:', cbPaymentStartDate.value);
    }
    
    if (cbBillingInterval) {
        cbBillingInterval.value = '1';
        console.log('✓ Cross Border billing_interval set to:', cbBillingInterval.value);
    }
    
    // Cross Border SI and API version
    const cbSi = document.getElementById('cb_si');
    const cbApiVersion = document.getElementById('cb_api_version');
    
    if (cbSi) cbSi.value = '1';
    if (cbApiVersion) cbApiVersion.value = '7';
    
    // Non-Seamless subscription defaults
    const subPaymentStartDate = document.getElementById('sub_payment_start_date');
    const subBillingInterval = document.getElementById('sub_billing_interval');
    
    if (subPaymentStartDate) {
        subPaymentStartDate.value = today;
        subPaymentStartDate.min = today;
        console.log('✓ Non-Seamless payment_start_date set to:', subPaymentStartDate.value);
    }
    
    if (subBillingInterval) {
        subBillingInterval.value = '1';
        console.log('✓ Non-Seamless billing_interval set to:', subBillingInterval.value);
    }
    
    // Non-Seamless SI and API version
    const subSi = document.getElementById('sub_si');
    const subApiVersion = document.getElementById('sub_api_version');
    
    if (subSi) subSi.value = '1';
    if (subApiVersion) subApiVersion.value = '7';
    
    // UPI OTM defaults
    const upiPaymentStartDate = document.getElementById('upi_payment_start_date');
    const upiPaymentEndDate = document.getElementById('upi_payment_end_date');
    
    if (upiPaymentStartDate) {
        upiPaymentStartDate.value = today;
        upiPaymentStartDate.min = today;
        console.log('✓ UPI OTM payment_start_date set to:', upiPaymentStartDate.value);
    }
    
    if (upiPaymentEndDate) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        upiPaymentEndDate.value = endDate.toISOString().split('T')[0];
        console.log('✓ UPI OTM payment_end_date set to:', upiPaymentEndDate.value);
    }
    
    console.log('=== Subscription Fields Initialization Complete ===');
}

/**
 * Load flow from URL hash or pathname
 */
function loadFlowFromURL() {
    const validFlows = ['crossborder', 'payu-hosted', 'subscription', 'tpv', 'upiotm', 'preauth', 'checkoutplus', 'split', 'bankoffer'];
    
    // Map route names to internal flow identifiers
    const routeToFlowMap = {
        'payu-hosted': 'nonseamless'
    };
    
    let flowFromURL = null;
    let source = '';
    
    // Check hash first
    const hash = window.location.hash.substring(1);
    if (hash && validFlows.includes(hash)) {
        const routeFromHash = hash;
        flowFromURL = routeToFlowMap[routeFromHash] || routeFromHash;
        source = 'hash';
        console.log('=== Loading Flow from URL Hash ===');
        console.log('Hash:', hash);
        console.log('Mapped Flow:', flowFromURL);
    } else {
        // Fall back to pathname-based routing
        const pathname = window.location.pathname;
        const pathSegments = pathname.split('/').filter(segment => segment !== '');
        
        const flowFromPath = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1].toLowerCase() : null;
        const routeFromURL = validFlows.includes(flowFromPath) ? flowFromPath : null;
        flowFromURL = routeFromURL && routeToFlowMap[routeFromURL] ? routeToFlowMap[routeFromURL] : routeFromURL;
        source = 'pathname';
        if (flowFromURL) {
            console.log('=== Loading Flow from URL Path ===');
            console.log('Flow from URL:', flowFromURL);
        }
    }
    
    if (flowFromURL) {
        // Hide home page
        const homePage = document.getElementById('homePage');
        if (homePage) {
            homePage.classList.add('hidden');
        }
        
        // Hide all flows first
        document.querySelectorAll('.flow-content').forEach(function(section) {
            section.classList.remove('active');
        });
        
        // Show the flow from URL
        const flowElement = document.getElementById(flowFromURL + 'Flow');
        if (flowElement) {
            flowElement.classList.add('active');
        }
        currentFlow = flowFromURL;
        
        // Track flow click in Google Analytics
        if (typeof trackFlowClick === 'function') {
            trackFlowClick(flowFromURL);
        }
        
        // Save to localStorage
        localStorage.setItem('currentPaymentFlow', flowFromURL);
        
        // Handle cross border payment type
        if (flowFromURL === 'crossborder') {
            const savedPaymentType = localStorage.getItem('currentPaymentType');
            if (savedPaymentType) {
                currentPaymentType = savedPaymentType;
                if (savedPaymentType === 'subscription') {
                    document.getElementById('cb-onetime-section')?.classList.remove('active');
                    document.getElementById('cb-subscription-section')?.classList.add('active');
                    document.getElementById('cb-onetime-udf-section')?.classList.remove('active');
                    document.getElementById('cb-subscription-udf-section')?.classList.add('active');
                }
            }
        }
        
        // Initialize split flow
        if (flowFromURL === 'split') {
            const container = document.getElementById('splitRowsContainer');
            if (container) {
                container.innerHTML = '';
                splitRowCounter = 0;
                addSplitRow();
            }
        }
        
        console.log('✓ Flow loaded from URL ' + source + ' successfully');
    } else {
        console.log('⚠️ No valid flow found in URL');
        // Show home page when no flow is in URL
        showHomePage();
    }
}

/**
 * Show a specific payment flow
 * @param {string} flowId - Flow identifier (e.g., 'crossborder', 'nonseamless')
 */
function showFlow(flowId) {
    console.log('=== Showing Flow: ' + flowId + ' ===');
    
    // Track flow click in Google Analytics
    if (typeof trackFlowClick === 'function') {
        trackFlowClick(flowId);
    }
    
    // Hide home page
    const homePage = document.getElementById('homePage');
    if (homePage) {
        homePage.classList.add('hidden');
    }
    
    // Hide all flows first
    document.querySelectorAll('.flow-content').forEach(function(section) {
        section.classList.remove('active');
    });
    
    // Show the selected flow
    const flowElement = document.getElementById(flowId + 'Flow');
    if (flowElement) {
        flowElement.classList.add('active');
        currentFlow = flowId;
        
        // Save to localStorage
        localStorage.setItem('currentPaymentFlow', flowId);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Handle cross border payment type
        if (flowId === 'crossborder') {
            const savedPaymentType = localStorage.getItem('currentPaymentType');
            if (savedPaymentType) {
                currentPaymentType = savedPaymentType;
                if (savedPaymentType === 'subscription') {
                    document.getElementById('cb-onetime-section')?.classList.remove('active');
                    document.getElementById('cb-subscription-section')?.classList.add('active');
                    document.getElementById('cb-onetime-udf-section')?.classList.remove('active');
                    document.getElementById('cb-subscription-udf-section')?.classList.add('active');
                }
            }
        }
        
        // Initialize split flow
        if (flowId === 'split') {
            const container = document.getElementById('splitRowsContainer');
            if (container) {
                container.innerHTML = '';
                splitRowCounter = 0;
                if (typeof addSplitRow === 'function') {
                    addSplitRow();
                }
            }
        }
        
        console.log('✓ Flow ' + flowId + ' displayed successfully');
    } else {
        console.error('✗ Flow element not found: ' + flowId + 'Flow');
    }
}

/**
 * Show home page
 */
function showHomePage() {
    // Hide all flows
    document.querySelectorAll('.flow-content').forEach(function(section) {
        section.classList.remove('active');
    });
    
    // Show home page
    const homePage = document.getElementById('homePage');
    if (homePage) {
        homePage.classList.remove('hidden');
    }
    
    currentFlow = '';
    localStorage.removeItem('currentPaymentFlow');
}

/**
 * Initialize button click tracking for all buttons
 */
function initializeButtonTracking() {
    // Use event delegation to track all button clicks
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // Check if the clicked element is a button or inside a button
        const button = target.closest('button');
        if (!button) return;
        
        // Get button information
        const buttonId = button.id || '';
        const buttonText = button.textContent.trim() || button.innerText.trim() || '';
        const buttonType = button.type || 'button';
        const buttonClass = button.className || '';
        
        // Skip tracking for certain buttons (like remove buttons, toggle buttons, etc.)
        if (buttonClass.includes('remove-split-btn') || 
            buttonClass.includes('copy-button') ||
            button.id === 'checkoutPlusScript') {
            return;
        }
        
        // Determine button name
        let buttonName = buttonId || buttonText.substring(0, 50) || 'unnamed_button';
        
        // Track the button click
        if (typeof trackButtonClick === 'function') {
            trackButtonClick(buttonName, buttonText, currentFlow);
        }
    }, true); // Use capture phase to catch all clicks
    
    console.log('✓ Button click tracking initialized');
}

