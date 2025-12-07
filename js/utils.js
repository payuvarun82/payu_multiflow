/**
 * PayU Integration Lab - Utility Functions
 * =========================================
 * Common utility functions used across the application
 */

/**
 * SECURITY: HTML Escaping Function to Prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// GOOGLE ANALYTICS TRACKING
// ============================================

/**
 * Track Google Analytics event
 * @param {string} eventName - Name of the event
 * @param {string} eventCategory - Category of the event
 * @param {string} eventLabel - Label for the event (optional)
 * @param {string} eventValue - Value for the event (optional)
 */
function trackGAEvent(eventName, eventCategory, eventLabel, eventValue) {
    if (typeof gtag !== 'undefined') {
        const eventParams = {
            'event_category': eventCategory,
            'event_label': eventLabel || '',
            'value': eventValue || 0
        };
        gtag('event', eventName, eventParams);
        console.log('📊 GA Event Tracked:', eventName, eventParams);
    } else {
        console.warn('⚠️ Google Analytics (gtag) not loaded');
    }
}

/**
 * Track button click event
 * @param {string} buttonName - Name/ID of the button
 * @param {string} buttonText - Text content of the button
 * @param {string} flow - Current flow context (optional)
 */
function trackButtonClick(buttonName, buttonText, flow) {
    const flowContext = flow || currentFlow || 'home';
    trackGAEvent('button_click', 'user_interaction', buttonName, 0);
    trackGAEvent('button_click_' + flowContext, 'user_interaction', buttonName + ' - ' + buttonText, 0);
}

/**
 * Track flow selection event
 * @param {string} flowId - Flow identifier
 */
function trackFlowClick(flowId) {
    const flowNames = {
        'crossborder': 'Cross Border Payment',
        'nonseamless': 'Pre-built Checkout',
        'subscription': 'Subscription Payment',
        'tpv': 'TPV Payment',
        'upiotm': 'UPI OTM',
        'preauth': 'PreAuth Card Flow',
        'checkoutplus': 'Checkout Plus',
        'split': 'Split Payment',
        'bankoffer': 'Bank Offers'
    };
    const flowName = flowNames[flowId] || flowId;
    trackGAEvent('flow_selected', 'navigation', flowName, 0);
    trackGAEvent('flow_click', 'navigation', flowId, 0);
}

// ============================================
// CHARACTER COUNTER FUNCTIONS
// ============================================

/**
 * Update character counter for an input element
 * @param {HTMLInputElement} inputElement - Input element with maxlength
 */
function updateCharCounter(inputElement) {
    const maxLength = parseInt(inputElement.getAttribute('maxlength'));
    const currentLength = inputElement.value.length;
    const remaining = maxLength - currentLength;
    
    const counterId = inputElement.id + '_counter';
    let counter = document.getElementById(counterId);
    
    if (counter) {
        counter.textContent = `${currentLength}/${maxLength}`;
        
        counter.classList.remove('warning', 'error');
        if (remaining === 0) {
            counter.classList.add('error');
        } else if (remaining <= maxLength * 0.1) {
            counter.classList.add('warning');
        }
    }
}

/**
 * Initialize character counters for all inputs with maxlength
 */
function initializeCharCounters() {
    const inputsWithMaxLength = document.querySelectorAll('input[maxlength]:not([type="hidden"])');
    
    inputsWithMaxLength.forEach(input => {
        input.addEventListener('input', function() {
            updateCharCounter(this);
        });
        updateCharCounter(input);
    });
    
    setTimeout(() => {
        inputsWithMaxLength.forEach(input => {
            if (input.value) {
                updateCharCounter(input);
            }
        });
    }, 100);
}

// ============================================
// TRANSACTION ID FUNCTIONS
// ============================================

/**
 * Initialize transaction ID field listeners for custom credentials mode
 */
function initializeTxnidListeners() {
    const txnidFields = [
        'cb_txnid_display', 'ns_txnid_display', 'sub_txnid_display',
        'tpv_txnid_display', 'upi_txnid_display', 'preauth_txnid_display',
        'cp_txnid_display', 'split_txnid_display', 'bo_txnid_display'
    ];
    
    txnidFields.forEach(fieldId => {
        const displayField = document.getElementById(fieldId);
        if (!displayField) return;
        
        const prefix = fieldId.replace('_txnid_display', '');
        const hiddenField = document.getElementById(prefix + '_txnid');
        const hashField = document.getElementById(prefix + '_hash');
        
        displayField.addEventListener('input', function() {
            if (hiddenField) {
                hiddenField.value = this.value;
            }
            if (hashField) {
                hashField.value = '';
            }
            updateCharCounter(this);
        });
        
        displayField.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) return;
            
            const validPattern = /^[A-Za-z0-9_-]+$/;
            if (!validPattern.test(value)) {
                alert('Transaction ID can only contain letters, numbers, underscores (_), and hyphens (-).\nPlease remove any special characters.');
                this.focus();
                return;
            }
            
            if (value.length > 25) {
                alert('Transaction ID cannot exceed 25 characters.\nCurrent length: ' + value.length);
                this.focus();
            }
        });
    });
    
    console.log('✓ Transaction ID field listeners initialized for custom credentials mode');
}

/**
 * Generate unique transaction ID for a flow
 * @param {string} flow - Flow identifier
 * @returns {string} Generated transaction ID
 */
function generateTransactionId(flow) {
    const elementPrefix = getFlowPrefix(flow);
    
    // Short prefix for transaction ID value
    const txnPrefixMap = {
        'crossborder': 'CB',
        'subscription': 'SUB',
        'tpv': 'TPV',
        'upiotm': 'UPI',
        'preauth': 'PRE',
        'checkoutplus': 'CP',
        'split': 'SPL',
        'bankoffer': 'BO',
        'nonseamless': 'NS'
    };
    const txnPrefix = txnPrefixMap[flow] || 'NS';
    
    // Generate shorter transaction ID (max 25 chars)
    const timestampSec = Math.floor(Date.now() / 1000);
    const randomSuffix = Math.floor(Math.random() * 10000);
    const txnId = 'TXN_' + txnPrefix + '_' + timestampSec + '_' + randomSuffix;
    
    if (txnId.length > 25) {
        console.warn('⚠️ Generated txnId exceeds 25 chars:', txnId, '(', txnId.length, 'chars)');
    }
    
    // Update hidden field
    const txnidField = document.getElementById(elementPrefix + '_txnid');
    if (txnidField) {
        txnidField.value = txnId;
        console.log('🆔 Generated Transaction ID for ' + flow + ':', txnId, '(' + txnId.length + ' chars)');
    }
    
    // Update display field
    const txnidDisplayField = document.getElementById(elementPrefix + '_txnid_display');
    if (txnidDisplayField) {
        txnidDisplayField.value = txnId;
        updateCharCounter(txnidDisplayField);
    }
    
    return txnId;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Add validation listeners for all flows
 */
function addValidationListeners() {
    const flowValidations = [
        { prefix: 'cb', flow: 'crossborder' },
        { prefix: 'ns', flow: 'nonseamless' },
        { prefix: 'sub', flow: 'subscription' },
        { prefix: 'upi', flow: 'upiotm' },
        { prefix: 'preauth', flow: 'preauth' },
        { prefix: 'cp', flow: 'checkoutplus' },
        { prefix: 'split', flow: 'split' },
        { prefix: 'bo', flow: 'bankoffer' },
        { prefix: 'tpv', flow: 'tpv' }
    ];
    
    flowValidations.forEach(({ prefix, flow }) => {
        const phoneInput = document.getElementById(prefix + '_phone');
        const emailInput = document.getElementById(prefix + '_email');
        
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                validatePhone(flow);
            });
        }
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                validateEmail(flow);
            });
        }
    });
}

/**
 * Validate phone number
 * @param {string} flow - Flow identifier
 * @returns {boolean} Validation result
 */
function validatePhone(flow) {
    const prefix = getFlowPrefix(flow);
    const phoneInput = document.getElementById(prefix + '_phone');
    const phoneError = document.getElementById(prefix + '-phone-error');
    
    if (!phoneInput) return true;
    
    const phone = phoneInput.value.replace(/[^0-9]/g, '');
    const limitedPhone = phone.substring(0, 10);
    phoneInput.value = limitedPhone;
    
    if (limitedPhone.length === 0) {
        phoneInput.classList.remove('error');
        if (phoneError) phoneError.style.display = 'none';
        return true;
    }
    
    if (limitedPhone.length !== 10) {
        phoneInput.classList.add('error');
        if (phoneError) {
            phoneError.textContent = 'Phone number must be exactly 10 digits (currently ' + limitedPhone.length + ' digits)';
            phoneError.style.display = 'block';
        }
        return false;
    }
    
    phoneInput.classList.remove('error');
    if (phoneError) phoneError.style.display = 'none';
    return true;
}

/**
 * Validate email address
 * @param {string} flow - Flow identifier
 * @returns {boolean} Validation result
 */
function validateEmail(flow) {
    const prefix = getFlowPrefix(flow);
    const emailInput = document.getElementById(prefix + '_email');
    const emailError = document.getElementById(prefix + '-email-error');
    
    if (!emailInput) return true;
    
    const email = emailInput.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email.length === 0) {
        emailInput.classList.remove('error');
        if (emailError) emailError.style.display = 'none';
        return true;
    }
    
    if (!emailRegex.test(email)) {
        emailInput.classList.add('error');
        if (emailError) {
            emailError.textContent = 'Please enter a valid email address';
            emailError.style.display = 'block';
        }
        return false;
    }
    
    emailInput.classList.remove('error');
    if (emailError) emailError.style.display = 'none';
    return true;
}

/**
 * Validate subscription start date
 * @param {string} flow - Flow identifier
 * @returns {boolean} Validation result
 */
function validateSubscriptionStartDate(flow) {
    const prefix = flow === 'crossborder' ? 'cb' : 'sub';
    const startDateInput = document.getElementById(prefix + '_payment_start_date');
    
    if (!startDateInput || !startDateInput.value) return true;
    
    const selectedDate = new Date(startDateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        alert('Payment Start Date cannot be in the past. Please select current date or a future date.');
        const todayStr = new Date().toISOString().split('T')[0];
        startDateInput.value = todayStr;
        startDateInput.min = todayStr;
        return false;
    }
    
    return true;
}

/**
 * Validate UPI OTM start date
 * @returns {boolean} Validation result
 */
function validateUpiOtmStartDate() {
    const startDateInput = document.getElementById('upi_payment_start_date');
    
    if (!startDateInput || !startDateInput.value) return true;
    
    const selectedDate = new Date(startDateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        alert('Payment Start Date cannot be in the past. Please select current date or a future date.');
        const todayStr = new Date().toISOString().split('T')[0];
        startDateInput.value = todayStr;
        startDateInput.min = todayStr;
        return false;
    }
    
    return true;
}

/**
 * Validate UPI OTM date range
 * @returns {boolean} Validation result
 */
function validateUpiOtmDates() {
    const startDate = document.getElementById('upi_payment_start_date');
    const endDate = document.getElementById('upi_payment_end_date');
    
    if (!startDate || !endDate || !startDate.value || !endDate.value) {
        return true;
    }
    
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 14) {
        alert('Error: Payment End Date cannot be more than 14 days from the Start Date.\n\nCurrent difference: ' + diffDays + ' days\nMaximum allowed: 14 days');
        const newEndDate = new Date(start);
        newEndDate.setDate(start.getDate() + 7);
        endDate.value = newEndDate.toISOString().split('T')[0];
        return false;
    }
    
    if (end < start) {
        alert('Error: Payment End Date cannot be before the Start Date.');
        endDate.value = startDate.value;
        return false;
    }
    
    return true;
}

// ============================================
// CREDENTIALS FUNCTIONS
// ============================================

/**
 * Get merchant credentials for a flow
 * @param {string} flow - Flow identifier
 * @returns {Object} Object with key and salt
 */
function getCredentials(flow) {
    const prefix = getFlowPrefix(flow);
    const useCustom = document.getElementById(prefix + '_use_custom_keys')?.checked;
    
    if (useCustom) {
        const customKey = document.getElementById(prefix + '_custom_key')?.value;
        const customSalt = document.getElementById(prefix + '_custom_salt')?.value;
        
        if (!customKey || !customSalt) {
            console.warn('Custom credentials not fully provided, using defaults');
            return { key: DEFAULT_KEY, salt: DEFAULT_SALT };
        }
        
        return { key: customKey, salt: customSalt };
    }
    
    return { key: DEFAULT_KEY, salt: DEFAULT_SALT };
}

/**
 * Toggle custom keys visibility
 * @param {string} flow - Flow identifier
 */
function toggleCustomKeys(flow) {
    const prefix = getFlowPrefix(flow);
    const isCustom = document.getElementById(prefix + '_use_custom_keys').checked;
    const customFields = document.getElementById(prefix + '-custom-key-fields');
    
    const txnidDisplay = document.getElementById(prefix + '_txnid_display');
    const txnidHidden = document.getElementById(prefix + '_txnid');
    const txnidLabel = document.querySelector('label[for="' + prefix + '_txnid_display"]');
    const templateWrapper = document.getElementById(prefix + '-generate-template-wrapper');
    
    if (isCustom) {
        customFields.classList.add('active');
        document.getElementById(prefix + '_custom_key').value = '';
        document.getElementById(prefix + '_custom_salt').value = '';
        document.getElementById(prefix + '_custom_salt').type = 'password';
        
        if (templateWrapper) templateWrapper.style.display = 'none';
        
        if (txnidDisplay) {
            txnidDisplay.removeAttribute('readonly');
            txnidDisplay.style.backgroundColor = '#ffffff';
            txnidDisplay.style.cursor = 'text';
            txnidDisplay.value = '';
            if (txnidHidden) txnidHidden.value = '';
            console.log('✓ Transaction ID field enabled for editing');
        }
        
        if (txnidLabel) {
            txnidLabel.innerHTML = 'Transaction ID <span class="required">*</span> <span style="color: #ed8936;">(Enter Your Custom txnid - Max 25 chars)</span>';
        }
    } else {
        customFields.classList.remove('active');
        document.getElementById(prefix + '_custom_key').value = '';
        document.getElementById(prefix + '_custom_salt').value = '';
        
        if (templateWrapper) templateWrapper.style.display = 'block';
        
        if (txnidDisplay) {
            txnidDisplay.setAttribute('readonly', true);
            txnidDisplay.style.backgroundColor = '#f0f0f0';
            txnidDisplay.style.cursor = 'not-allowed';
            console.log('✓ Transaction ID field disabled - regenerating auto txnid');
        }
        
        if (txnidLabel) {
            txnidLabel.innerHTML = 'Transaction ID <span style="color: #48bb78;">(Auto-Generated from Back-end - Non Editable)</span>';
        }
        
        generateTransactionId(flow);
    }
    
    // Clear cached hash
    const hashField = document.getElementById(prefix + '_hash');
    if (hashField) hashField.value = '';
    
    // Handle split payment specific logic
    if (flow === 'split') {
        handleSplitCustomKeysToggle(isCustom);
    }
    
    // Handle bank offers specific logic
    if (flow === 'bankoffer') {
        handleBankOfferCustomKeysToggle(isCustom);
    }
}

/**
 * Toggle salt visibility
 * @param {string} flow - Flow identifier
 */
function toggleSaltVisibility(flow) {
    const prefix = getFlowPrefix(flow);
    const saltInput = document.getElementById(prefix + '_custom_salt');
    const toggleButton = event.target;
    
    if (saltInput.type === 'password') {
        saltInput.type = 'text';
        toggleButton.textContent = 'Hide';
    } else {
        saltInput.type = 'password';
        toggleButton.textContent = 'Show';
    }
}

/**
 * Fill form with sample template data
 * @param {string} flow - Flow identifier
 */
function generateTemplate(flow) {
    const prefix = getFlowPrefix(flow);
    
    const customKeysCheckbox = document.getElementById(prefix + '_use_custom_keys');
    if (customKeysCheckbox && customKeysCheckbox.checked) {
        alert('Fill with Sample Data is only available when using predefined credentials.\nPlease uncheck "Use Your Merchant UAT Key & Salt" to use this feature.');
        return;
    }
    
    const templateData = {
        amount: '15000',
        productinfo: 'DESKTOP',
        firstname: 'Sunit',
        lastname: 'Kumar',
        email: 'sunit.kumar@mail.com',
        phone: '9876543210',
        address1: 'FIRST FLOOR',
        address2: 'NEW ASHOK NAGAR',
        city: 'Delhi',
        state: 'Delhi',
        country: 'INDIA',
        zipcode: '201303',
        udf1: 'Testing UDF 1',
        udf2: 'Testing UDF2',
        udf5: 'Sample_Invoice_11',
        user_token: '1234567890'
    };
    
    function setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    
    // Fill common fields
    setFieldValue(prefix + '_amount', templateData.amount);
    setFieldValue(prefix + '_productinfo', templateData.productinfo);
    setFieldValue(prefix + '_firstname', templateData.firstname);
    setFieldValue(prefix + '_lastname', templateData.lastname);
    setFieldValue(prefix + '_email', templateData.email);
    setFieldValue(prefix + '_phone', templateData.phone);
    
    // Fill address fields
    setFieldValue(prefix + '_address1', templateData.address1);
    setFieldValue(prefix + '_address2', templateData.address2);
    setFieldValue(prefix + '_city', templateData.city);
    setFieldValue(prefix + '_state', templateData.state);
    setFieldValue(prefix + '_country', templateData.country);
    setFieldValue(prefix + '_zipcode', templateData.zipcode);
    
    // Fill UDF fields
    if (flow === 'crossborder') {
        setFieldValue(prefix + '_udf1_input', templateData.udf1);
        setFieldValue(prefix + '_udf2_input', templateData.udf2);
        setFieldValue(prefix + '_udf5_input', templateData.udf5);
        setFieldValue('cb_sub_udf1_input', templateData.udf1);
        setFieldValue('cb_sub_udf2_input', templateData.udf2);
        setFieldValue('cb_sub_udf5_input', templateData.udf5);
    } else {
        setFieldValue(prefix + '_udf1', templateData.udf1);
        setFieldValue(prefix + '_udf2', templateData.udf2);
        setFieldValue(prefix + '_udf5', templateData.udf5);
    }
    
    // Special handling for bank offers
    if (flow === 'bankoffer') {
        setFieldValue('bo_user_token', templateData.user_token);
    }
    
    console.log('✓ Template data filled for ' + flow + ' flow');
}

// ============================================
// HASH GENERATION
// ============================================

/**
 * Generate payment hash
 * @param {string} flow - Flow identifier
 * @returns {Object} Hash data object
 */
function generateHash(flow) {
    const prefix = getFlowPrefix(flow);
    const credentials = getCredentials(flow);
    
    const txnid = document.getElementById(prefix + '_txnid').value;
    const amount = document.getElementById(prefix + '_amount').value;
    const productinfo = document.getElementById(prefix + '_productinfo').value;
    const firstname = document.getElementById(prefix + '_firstname').value;
    const email = document.getElementById(prefix + '_email').value;
    
    let udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '';
    let hashString = '';
    let hashFormula = '';
    let siDetailsJson = '';
    
    // Get UDF values based on flow
    if (flow === 'crossborder' && currentPaymentType === 'subscription') {
        udf1 = document.getElementById('cb_sub_udf1_input')?.value || '';
        udf2 = document.getElementById('cb_sub_udf2_input')?.value || '';
        udf3 = document.getElementById('cb_sub_udf3_input')?.value || '';
        udf4 = document.getElementById('cb_sub_udf4_input')?.value || '';
        udf5 = document.getElementById('cb_sub_udf5_input')?.value || '';
    } else if (flow === 'crossborder') {
        udf1 = document.getElementById('cb_udf1_input')?.value || '';
        udf2 = document.getElementById('cb_udf2_input')?.value || '';
        udf3 = document.getElementById('cb_udf3_input')?.value || '';
        udf4 = document.getElementById('cb_udf4_input')?.value || '';
        udf5 = document.getElementById('cb_udf5_input')?.value || '';
    } else {
        udf1 = document.getElementById(prefix + '_udf1')?.value || '';
        udf2 = document.getElementById(prefix + '_udf2')?.value || '';
        udf3 = document.getElementById(prefix + '_udf3')?.value || '';
        udf4 = document.getElementById(prefix + '_udf4')?.value || '';
        udf5 = document.getElementById(prefix + '_udf5')?.value || '';
    }
    
    // Build hash string based on flow type
    if (flow === 'crossborder' && currentPaymentType === 'subscription') {
        siDetailsJson = buildSubscriptionSiDetails('cb');
        document.getElementById('cb_si_details').value = siDetailsJson;
        
        const buyerTypeBusiness = document.getElementById('cb_buyer_type')?.value;
        if (buyerTypeBusiness !== '') {
            hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + siDetailsJson + '|' + credentials.salt + '|' + buyerTypeBusiness;
            hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||si_details|SALT|buyer_type_business)';
        } else {
            hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + siDetailsJson + '|' + credentials.salt;
            hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||si_details|SALT)';
        }
    } else if (flow === 'subscription') {
        siDetailsJson = buildSubscriptionSiDetails('sub');
        document.getElementById('sub_si_details').value = siDetailsJson;
        hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + siDetailsJson + '|' + credentials.salt;
        hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||si_details|SALT)';
    } else if (flow === 'crossborder') {
        const buyerTypeBusiness = document.getElementById('cb_buyer_type')?.value;
        if (buyerTypeBusiness !== '') {
            hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + credentials.salt + '|' + buyerTypeBusiness;
            hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT|buyer_type_business)';
        } else {
            hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + credentials.salt;
            hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)';
        }
    } else if (flow === 'tpv') {
        const beneficiaryDetail = buildBeneficiaryDetail();
        document.getElementById('tpv_beneficiarydetail').value = beneficiaryDetail;
        hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + beneficiaryDetail + '|' + credentials.salt;
        hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||beneficiarydetail|SALT)';
    } else if (flow === 'upiotm') {
        siDetailsJson = buildUpiOtmSiDetails();
        document.getElementById('upi_si_details').value = siDetailsJson;
        hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + siDetailsJson + '|' + credentials.salt;
        hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||si_details|SALT)';
    } else if (flow === 'split') {
        const splitRequestJson = buildSplitRequestJson();
        if (!splitRequestJson) {
            throw new Error('Failed to build splitRequest JSON');
        }
        siDetailsJson = splitRequestJson;
        hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + credentials.salt + '|' + splitRequestJson;
        hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT|splitRequest)';
    } else if (flow === 'bankoffer') {
        const cartDetails = buildBankOfferCartDetails();
        const phone = document.getElementById('bo_phone')?.value || '';
        const offerKey = document.getElementById('bo_offer_key')?.value.trim() || '';
        const userToken = document.getElementById('bo_user_token')?.value.trim() || '';
        
        if (cartDetails) {
            const offerAutoApply = '';
            const extraCharges = '';
            hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + userToken + '|' + offerKey + '|' + offerAutoApply + '|' + cartDetails + '|' + extraCharges + '|' + phone + '|' + credentials.salt;
            hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||user_token|offer_key|offer_auto_apply|cart_details|extra_charges|phone|SALT)';
        } else {
            hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + credentials.salt;
            hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)';
        }
    } else {
        // Standard hash for nonseamless, preauth, checkoutplus
        hashString = credentials.key + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|' + udf1 + '|' + udf2 + '|' + udf3 + '|' + udf4 + '|' + udf5 + '||||||' + credentials.salt;
        hashFormula = 'SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)';
    }
    
    const hash = CryptoJS.SHA512(hashString).toString();
    
    console.log('=== Hash Generation ===');
    console.log('Flow:', flow);
    console.log('Hash Formula:', hashFormula);
    console.log('Generated Hash:', hash);
    
    return {
        hash: hash,
        hashString: hashString,
        hashFormula: hashFormula,
        siDetails: siDetailsJson,
        splitRequest: flow === 'split' ? siDetailsJson : '',
        udf1: udf1,
        udf2: udf2,
        udf3: udf3,
        udf4: udf4,
        udf5: udf5,
        credentials: credentials
    };
}

/**
 * Build subscription SI details JSON
 * @param {string} prefix - Element prefix
 * @returns {string} JSON string
 */
function buildSubscriptionSiDetails(prefix) {
    const billingAmount = document.getElementById(prefix + '_billing_amount')?.value;
    const billingCycle = document.getElementById(prefix + '_billing_cycle')?.value;
    const billingInterval = document.getElementById(prefix + '_billing_interval')?.value;
    const paymentStartDate = document.getElementById(prefix + '_payment_start_date')?.value;
    const paymentEndDate = document.getElementById(prefix + '_payment_end_date')?.value;
    
    const siDetails = {
        "billingAmount": billingAmount,
        "billingCurrency": "INR",
        "billingCycle": billingCycle,
        "billingInterval": parseInt(billingInterval),
        "paymentStartDate": paymentStartDate
    };
    
    if (paymentEndDate) {
        siDetails.paymentEndDate = paymentEndDate;
    }
    
    return JSON.stringify(siDetails);
}

/**
 * Build UPI OTM SI details JSON
 * @returns {string} JSON string
 */
function buildUpiOtmSiDetails() {
    const paymentStartDate = document.getElementById('upi_payment_start_date')?.value || '';
    const paymentEndDate = document.getElementById('upi_payment_end_date')?.value || '';
    
    return JSON.stringify({
        "paymentStartDate": paymentStartDate,
        "paymentEndDate": paymentEndDate
    });
}

/**
 * Build beneficiary detail JSON for TPV
 * @returns {string} JSON string
 */
function buildBeneficiaryDetail() {
    const beneficiaryAccount = document.getElementById('tpv_beneficiary_account')?.value || '';
    const ifscCode = document.getElementById('tpv_ifsc_code')?.value || '';
    
    return JSON.stringify({
        "beneficiaryAccountNumber": beneficiaryAccount,
        "ifscCode": ifscCode
    });
}

