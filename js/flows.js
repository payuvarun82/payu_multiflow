/**
 * PayU Integration Lab - Payment Flows
 * =====================================
 * Payment flow specific functions and form handling
 */

// ============================================
// CROSS BORDER PAYMENT TYPE SELECTION
// ============================================

/**
 * Select payment type for cross border flow
 * @param {string} type - Payment type ('onetime' or 'subscription')
 * @param {string} flow - Flow identifier
 */
function selectPaymentType(type, flow) {
    if (flow !== 'crossborder') return;
    
    if (currentPaymentType === type) {
        console.log('Already on ' + type + ' payment type, no reset needed');
        return;
    }
    
    console.log('Switching from ' + currentPaymentType + ' to ' + type);
    currentPaymentType = type;
    
    // Update button states
    document.querySelectorAll('#crossborderFlow .payment-type-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    document.getElementById('cb-' + type + '-btn')?.classList.add('active');
    
    // Show/hide sections
    const subscriptionConfig = document.getElementById('cb-subscription-config');
    const onetimeUdfSection = document.getElementById('cb-onetime-udf-section');
    const subscriptionUdfSection = document.getElementById('cb-subscription-udf-section');
    
    if (type === 'subscription') {
        subscriptionConfig?.classList.add('active');
        onetimeUdfSection?.classList.add('hidden');
        subscriptionUdfSection?.classList.remove('hidden');
        
        const enachNote = document.getElementById('cb_enach_amount_note');
        if (enachNote) enachNote.style.display = 'block';
        
        // Set default values
        const today = new Date().toISOString().split('T')[0];
        const cbBillingAmount = document.getElementById('cb_billing_amount');
        if (cbBillingAmount) cbBillingAmount.value = '';
        
        document.getElementById('cb_billing_cycle').value = 'MONTHLY';
        document.getElementById('cb_billing_interval').value = '1';
        document.getElementById('cb_payment_start_date').value = today;
        document.getElementById('cb_payment_end_date').value = '';
        
        // Reset subscription UDF fields
        ['cb_sub_udf1_input', 'cb_sub_udf2_input', 'cb_sub_udf3_input', 'cb_sub_udf4_input', 'cb_sub_udf5_input'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    } else {
        subscriptionConfig?.classList.remove('active');
        onetimeUdfSection?.classList.remove('hidden');
        subscriptionUdfSection?.classList.add('hidden');
        
        const enachNote = document.getElementById('cb_enach_amount_note');
        if (enachNote) enachNote.style.display = 'none';
        
        document.getElementById('cb_si_details').value = '';
        
        // Reset one-time UDF fields
        ['cb_udf1_input', 'cb_udf2_input', 'cb_udf3_input', 'cb_udf4_input', 'cb_udf5_input'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }
    
    // Clear hash
    const hashField = document.getElementById('cb_hash');
    if (hashField) hashField.value = '';
    
    hideDebugAndCurl('crossborder');
    
    localStorage.setItem('currentPaymentType', type);
    console.log('✓ Payment type saved to localStorage:', type);
}

// ============================================
// SPLIT PAYMENT FUNCTIONS
// ============================================

/**
 * Add a new split row
 */
function addSplitRow() {
    splitRowCounter++;
    const container = document.getElementById('splitRowsContainer');
    
    if (!container) {
        console.error('✗ Split rows container not found!');
        return;
    }
    
    const splitType = document.querySelector('input[name="split_type"]:checked')?.value || 'absolute';
    const useCustomKeysCheckbox = document.getElementById('split_use_custom_keys');
    const useCustomKeys = useCustomKeysCheckbox ? useCustomKeysCheckbox.checked : false;
    
    const existingRows = document.querySelectorAll('.split-row').length;
    let defaultMerchantKey = '';
    
    if (!useCustomKeys) {
        if (existingRows === 0) {
            defaultMerchantKey = 'gYoEaY';
        } else if (existingRows === 1) {
            defaultMerchantKey = '5rgA73';
        }
    }
    
    const placeholderText = splitType === 'absolute' ? '500.00' : '50';
    const amountLabel = splitType === 'absolute' ? 'Amount (INR)' : 'Percentage';
    
    let childTxnId = '';
    let isTxnIdReadonly = true;
    let txnIdPlaceholder = 'Auto-generated';
    let txnIdSmallText = 'Auto-generated unique ID';
    
    if (!useCustomKeys) {
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 10000);
        childTxnId = 'child_' + timestamp + '_' + randomSuffix;
    } else {
        isTxnIdReadonly = false;
        txnIdPlaceholder = 'Enter child transaction ID';
        txnIdSmallText = 'Enter your own transaction ID';
    }
    
    const rowId = splitRowCounter;
    
    const row = document.createElement('div');
    row.className = 'split-row';
    row.id = 'split_row_' + rowId;
    
    const readonlyAttr = isTxnIdReadonly ? 'readonly' : '';
    const readonlyStyle = isTxnIdReadonly ? 'background-color: #f0f0f0; cursor: not-allowed;' : '';
    
    row.innerHTML = `
        <div class="form-group">
            <label>Child Merchant Key <span class="required">*</span></label>
            <input type="text" class="split-merchant-key" placeholder="e.g., gYoEaY" required value="${escapeHtml(defaultMerchantKey)}">
            <small style="color: var(--text-tertiary);">Must be pre-configured with PayU</small>
        </div>
        <div class="form-group">
            <label>Child Transaction ID <span class="required">*</span></label>
            <input type="text" class="split-txn-id" placeholder="${escapeHtml(txnIdPlaceholder)}" required ${readonlyAttr} style="${readonlyStyle}" value="${escapeHtml(childTxnId)}">
            <small style="color: var(--text-tertiary);">${escapeHtml(txnIdSmallText)}</small>
        </div>
        <div class="form-group">
            <label>${escapeHtml(amountLabel)} <span class="required">*</span></label>
            <input type="number" class="split-amount" placeholder="${escapeHtml(placeholderText)}" step="0.01" min="0" required>
        </div>
        <div class="form-group">
            <label>Charges <span class="optional">(Optional)</span></label>
            <input type="number" class="split-charges" placeholder="0.00" value="0.00" step="0.01" min="0">
        </div>
        <button type="button" class="remove-split-btn" title="Remove this child" onclick="removeSplitRow(${rowId})">&times;</button>
    `;
    
    container.appendChild(row);
    console.log('✓ Split row #' + rowId + ' added');
}

/**
 * Remove a split row
 * @param {number} rowId - Row ID to remove
 */
function removeSplitRow(rowId) {
    const row = document.getElementById('split_row_' + rowId);
    if (row) {
        row.remove();
        console.log('✓ Removed split row #' + rowId);
    }
}

/**
 * Regenerate all child transaction IDs for split payment
 */
function regenerateSplitChildTransactionIds() {
    const useCustomKeysCheckbox = document.getElementById('split_use_custom_keys');
    const useCustomKeys = useCustomKeysCheckbox ? useCustomKeysCheckbox.checked : false;
    
    if (useCustomKeys) {
        console.log('⚠ Skipping transaction ID regeneration - using custom credentials');
        return;
    }
    
    const splitRows = document.querySelectorAll('.split-row');
    let regeneratedCount = 0;
    
    splitRows.forEach((row, index) => {
        const txnIdInput = row.querySelector('.split-txn-id');
        if (txnIdInput && txnIdInput.readOnly) {
            const timestamp = Date.now();
            const randomSuffix = Math.floor(Math.random() * 10000);
            txnIdInput.value = 'child_' + timestamp + '_' + randomSuffix;
            regeneratedCount++;
        }
    });
    
    console.log('✓ Regenerated ' + regeneratedCount + ' child transaction IDs');
}

/**
 * Update split placeholders when type changes
 */
function updateSplitPlaceholders() {
    const splitType = document.querySelector('input[name="split_type"]:checked')?.value || 'absolute';
    const amountInputs = document.querySelectorAll('.split-amount');
    const placeholderText = splitType === 'absolute' ? '500.00' : '50';
    const amountLabel = splitType === 'absolute' ? 'Amount (INR)' : 'Percentage';
    
    amountInputs.forEach(input => {
        input.placeholder = placeholderText;
        const label = input.closest('.form-group')?.querySelector('label');
        if (label) {
            label.innerHTML = amountLabel + ' <span class="required">*</span>';
        }
    });
    
    console.log('✓ Updated split placeholders for type:', splitType);
}

/**
 * Build splitRequest JSON from form inputs
 * @returns {string|null} JSON string or null if invalid
 */
function buildSplitRequestJson() {
    const splitType = document.querySelector('input[name="split_type"]:checked')?.value || 'absolute';
    const splitRows = document.querySelectorAll('.split-row');
    
    if (splitRows.length === 0) {
        alert('Please add at least one split merchant configuration');
        return null;
    }
    
    const splitInfo = {};
    
    splitRows.forEach((row) => {
        const merchantKey = row.querySelector('.split-merchant-key')?.value.trim();
        const txnId = row.querySelector('.split-txn-id')?.value.trim();
        const amount = row.querySelector('.split-amount')?.value.trim();
        const charges = row.querySelector('.split-charges')?.value.trim() || '0.00';
        
        if (merchantKey && txnId && amount) {
            splitInfo[merchantKey] = {
                "aggregatorSubTxnId": txnId,
                "aggregatorSubAmt": amount,
                "aggregatorCharges": charges
            };
        }
    });
    
    if (Object.keys(splitInfo).length === 0) {
        alert('Please fill in all required fields for split merchants');
        return null;
    }
    
    const splitRequest = {
        "type": splitType,
        "splitInfo": splitInfo
    };
    
    console.log('✓ Built splitRequest JSON');
    return JSON.stringify(splitRequest);
}

/**
 * Validate split amounts
 * @returns {boolean} Validation result
 */
function validateSplitAmounts() {
    const splitType = document.querySelector('input[name="split_type"]:checked')?.value || 'absolute';
    const splitRows = document.querySelectorAll('.split-row');
    
    if (splitRows.length === 0) {
        alert('Please add at least one split merchant configuration');
        return false;
    }
    
    let splitTotal = 0;
    splitRows.forEach(row => {
        const amount = parseFloat(row.querySelector('.split-amount')?.value) || 0;
        splitTotal += amount;
    });
    
    if (splitType === 'percentage' && splitTotal > 100) {
        alert('Split percentages cannot exceed 100%. Current total: ' + splitTotal + '%');
        return false;
    }
    
    return true;
}

/**
 * Handle split payment custom keys toggle
 * @param {boolean} isCustom - Whether custom keys are enabled
 */
function handleSplitCustomKeysToggle(isCustom) {
    const splitRows = document.querySelectorAll('.split-row');
    
    splitRows.forEach((row, index) => {
        const merchantKeyInput = row.querySelector('.split-merchant-key');
        const txnIdInput = row.querySelector('.split-txn-id');
        
        if (merchantKeyInput) {
            if (isCustom) {
                merchantKeyInput.value = '';
            } else {
                if (index === 0) merchantKeyInput.value = 'gYoEaY';
                else if (index === 1) merchantKeyInput.value = '5rgA73';
                else merchantKeyInput.value = '';
            }
        }
        
        if (txnIdInput) {
            if (isCustom) {
                txnIdInput.value = '';
                txnIdInput.removeAttribute('readonly');
                txnIdInput.style.backgroundColor = '';
                txnIdInput.style.cursor = '';
                txnIdInput.placeholder = 'Enter child transaction ID';
            } else {
                const timestamp = Date.now();
                const randomSuffix = Math.floor(Math.random() * 10000);
                txnIdInput.value = 'child_' + timestamp + '_' + randomSuffix;
                txnIdInput.setAttribute('readonly', 'readonly');
                txnIdInput.style.backgroundColor = '#f0f0f0';
                txnIdInput.style.cursor = 'not-allowed';
                txnIdInput.placeholder = 'Auto-generated';
            }
        }
    });
    
    // Add default row if none exist
    if (splitRows.length === 0 && !isCustom) {
        addSplitRow();
    }
}

// ============================================
// BANK OFFERS FUNCTIONS
// ============================================

/**
 * Toggle SKU offers section
 * @param {string} flow - Flow identifier
 */
function toggleSkuOffers(flow) {
    if (flow !== 'bankoffer') return;
    
    const skuCheckbox = document.getElementById('bo_enable_sku');
    const skuConfig = document.getElementById('bo-sku-config');
    const apiVersionSection = document.getElementById('bo-api-version-section');
    const isEnabled = skuCheckbox?.checked;
    
    if (isEnabled) {
        if (skuConfig) skuConfig.style.display = 'block';
        if (apiVersionSection) apiVersionSection.style.display = 'block';
        
        document.getElementById('bo_surcharges').value = '';
        document.getElementById('bo_pre_discount').value = '0';
        
        const container = document.getElementById('boSkuRowsContainer');
        if (container) container.innerHTML = '';
        boSkuRowCounter = 0;
        
        const useCustomKeys = document.getElementById('bo_use_custom_keys')?.checked;
        
        if (!useCustomKeys) {
            addBankOfferSkuRow('testProduct11', 'SkuTest11');
            addBankOfferSkuRow('testProduct12', 'SkuTest12');
            console.log('✓ SKU offers enabled with 2 predefined SKUs');
        }
        
        updateSkuLimitMessage();
    } else {
        if (skuConfig) skuConfig.style.display = 'none';
        if (apiVersionSection) apiVersionSection.style.display = 'none';
        
        const container = document.getElementById('boSkuRowsContainer');
        if (container) container.innerHTML = '';
        boSkuRowCounter = 0;
        
        document.getElementById('bo_surcharges').value = '';
        document.getElementById('bo_pre_discount').value = '0';
        document.getElementById('bo-json-preview').textContent = '';
        document.getElementById('bo-total-items').textContent = '0';
        document.getElementById('bo-calculated-amount').textContent = '0.00';
    }
}

/**
 * Update SKU limit message
 */
function updateSkuLimitMessage() {
    const currentCount = document.querySelectorAll('#boSkuRowsContainer > div').length;
    const limitMsg = document.getElementById('bo-sku-limit-msg');
    const addButton = document.querySelector('button[onclick="addBankOfferSkuRow()"]');
    
    if (currentCount >= 5) {
        if (limitMsg) {
            limitMsg.textContent = 'Maximum 5 SKUs reached';
            limitMsg.style.color = 'var(--warning-color)';
        }
        if (addButton) addButton.disabled = true;
    } else {
        if (limitMsg) {
            limitMsg.textContent = `${currentCount} of 5 SKUs added`;
            limitMsg.style.color = 'var(--text-tertiary)';
        }
        if (addButton) addButton.disabled = false;
    }
}

/**
 * Add SKU row for bank offers
 * @param {string} prefilledSkuId - Prefilled SKU ID
 * @param {string} prefilledSkuName - Prefilled SKU name
 */
function addBankOfferSkuRow(prefilledSkuId, prefilledSkuName) {
    const container = document.getElementById('boSkuRowsContainer');
    if (!container) return;
    
    const currentCount = document.querySelectorAll('#boSkuRowsContainer > div').length;
    if (currentCount >= 5) {
        alert('Maximum 5 SKUs allowed.');
        return;
    }
    
    // Auto-prefill based on position if using predefined keys
    if (!prefilledSkuId && !prefilledSkuName) {
        const useCustomKeys = document.getElementById('bo_use_custom_keys')?.checked;
        if (!useCustomKeys) {
            if (currentCount === 0) {
                prefilledSkuId = 'testProduct11';
                prefilledSkuName = 'SkuTest11';
            } else if (currentCount === 1) {
                prefilledSkuId = 'testProduct12';
                prefilledSkuName = 'SkuTest12';
            }
        }
    }
    
    boSkuRowCounter++;
    const rowId = boSkuRowCounter;
    
    const row = document.createElement('div');
    row.id = 'bo_sku_row_' + rowId;
    row.className = 'sku-row';
    row.style.cssText = 'margin-bottom: 1.5rem; padding: 1.5rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;';
    
    row.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h4 style="margin: 0; color: var(--accent-primary);">SKU Item #${rowId}</h4>
            <button type="button" class="remove-split-btn" onclick="removeBankOfferSkuRow(${rowId})">&times;</button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>SKU ID <span class="required">*</span></label>
                <input type="text" class="bo-sku-id" placeholder="e.g., testProduct11" required value="${escapeHtml(prefilledSkuId || '')}">
            </div>
            <div class="form-group">
                <label>SKU Name <span class="required">*</span></label>
                <input type="text" class="bo-sku-name" placeholder="e.g., SkuTest11" required value="${escapeHtml(prefilledSkuName || '')}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Amount per SKU (INR) <span class="required">*</span></label>
                <input type="number" class="bo-sku-amount" placeholder="20000" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label>Quantity <span class="required">*</span></label>
                <input type="number" class="bo-sku-quantity" placeholder="1" min="1" required>
            </div>
        </div>
        <div class="form-group">
            <label>Offer Key <span class="optional">(Optional)</span></label>
            <input type="text" class="bo-sku-offer-key" placeholder="e.g., flat500@2022">
            <small style="color: var(--text-tertiary);">Leave blank for auto-apply</small>
        </div>
    `;
    
    container.appendChild(row);
    
    // Add event listeners
    row.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updateBankOfferSkuPreview);
    });
    
    updateBankOfferSkuPreview();
    updateSkuLimitMessage();
    console.log('✓ SKU row #' + rowId + ' added');
}

/**
 * Remove SKU row
 * @param {number} rowId - Row ID to remove
 */
function removeBankOfferSkuRow(rowId) {
    const row = document.getElementById('bo_sku_row_' + rowId);
    if (row) {
        row.remove();
        updateBankOfferSkuPreview();
        updateSkuLimitMessage();
        console.log('✓ Removed SKU row #' + rowId);
    }
}

/**
 * Update SKU preview and cart summary
 */
function updateBankOfferSkuPreview() {
    const skuRows = document.querySelectorAll('#boSkuRowsContainer > div');
    
    if (skuRows.length === 0) {
        document.getElementById('bo-json-preview').textContent = '';
        document.getElementById('bo-total-items').textContent = '0';
        document.getElementById('bo-calculated-amount').textContent = '0';
        return;
    }
    
    const skuDetails = [];
    let totalItems = 0;
    let calculatedAmount = 0;
    
    skuRows.forEach(row => {
        const skuId = row.querySelector('.bo-sku-id')?.value.trim();
        const skuName = row.querySelector('.bo-sku-name')?.value.trim();
        const amountPerSku = parseFloat(row.querySelector('.bo-sku-amount')?.value) || 0;
        const quantity = parseInt(row.querySelector('.bo-sku-quantity')?.value) || 1;
        const offerKeyInput = row.querySelector('.bo-sku-offer-key')?.value.trim();
        
        let offerKey = null;
        let offerAutoApply = true;
        
        if (offerKeyInput) {
            offerKey = offerKeyInput.includes(',') ? offerKeyInput.split(',').map(k => k.trim()).filter(k => k) : [offerKeyInput];
            offerAutoApply = false;
        }
        
        if (skuId && skuName) {
            skuDetails.push({
                "sku_id": skuId,
                "sku_name": skuName,
                "amount_per_sku": amountPerSku,
                "quantity": quantity,
                "offer_key": offerKey,
                "offer_auto_apply": offerAutoApply
            });
            
            totalItems += quantity;
            calculatedAmount += (amountPerSku * quantity);
        }
    });
    
    const surcharges = document.getElementById('bo_surcharges')?.value.trim() || '';
    const preDiscount = parseFloat(document.getElementById('bo_pre_discount')?.value) || 0;
    
    const cartDetails = {
        "amount": calculatedAmount,
        "items": totalItems,
        "surcharges": surcharges,
        "pre_discount": preDiscount,
        "sku_details": skuDetails
    };
    
    document.getElementById('bo-json-preview').textContent = JSON.stringify(cartDetails, null, 2);
    document.getElementById('bo-total-items').textContent = totalItems;
    document.getElementById('bo-calculated-amount').textContent = calculatedAmount.toFixed(2);
}

/**
 * Build cart details JSON for bank offers
 * @returns {string|null} JSON string or null
 */
function buildBankOfferCartDetails() {
    const skuEnabled = document.getElementById('bo_enable_sku')?.checked;
    
    if (!skuEnabled) {
        return null;
    }
    
    const jsonPreview = document.getElementById('bo-json-preview')?.textContent;
    
    if (!jsonPreview || jsonPreview.trim() === '') {
        return null;
    }
    
    try {
        const cartDetails = JSON.parse(jsonPreview);
        return JSON.stringify(cartDetails);
    } catch (e) {
        console.error('✗ Failed to parse cart details:', e);
        return null;
    }
}

/**
 * Copy bank offer JSON to clipboard
 */
function copyBankOfferJson() {
    const jsonText = document.getElementById('bo-json-preview')?.textContent;
    if (!jsonText) {
        alert('No JSON to copy.');
        return;
    }
    
    navigator.clipboard.writeText(jsonText).then(function() {
        alert('JSON copied to clipboard!');
    }).catch(function(err) {
        console.error('✗ Failed to copy JSON:', err);
        alert('Failed to copy JSON. Please copy manually.');
    });
}

/**
 * Handle bank offer custom keys toggle
 * @param {boolean} isCustom - Whether custom keys are enabled
 */
function handleBankOfferCustomKeysToggle(isCustom) {
    const skuEnabled = document.getElementById('bo_enable_sku')?.checked;
    
    if (skuEnabled) {
        const container = document.getElementById('boSkuRowsContainer');
        if (container) container.innerHTML = '';
        boSkuRowCounter = 0;
        
        if (!isCustom) {
            addBankOfferSkuRow('testProduct11', 'SkuTest11');
            addBankOfferSkuRow('testProduct12', 'SkuTest12');
        }
        
        updateSkuLimitMessage();
    }
}

// ============================================
// FORM VALIDATION
// ============================================

/**
 * Validate form before submission
 * @param {string} flow - Flow identifier
 * @returns {boolean} Validation result
 */
function validateForm(flow) {
    const prefix = getFlowPrefix(flow);
    
    // Validate custom transaction ID
    const useCustomKeys = document.getElementById(prefix + '_use_custom_keys');
    if (useCustomKeys && useCustomKeys.checked) {
        const txnidDisplay = document.getElementById(prefix + '_txnid_display');
        const txnidHidden = document.getElementById(prefix + '_txnid');
        
        if (txnidDisplay && txnidHidden) {
            txnidHidden.value = txnidDisplay.value.trim();
        }
        
        const txnid = txnidDisplay ? txnidDisplay.value.trim() : '';
        
        if (!txnid) {
            alert('Transaction ID is required when using custom credentials.');
            if (txnidDisplay) txnidDisplay.focus();
            return false;
        }
        
        if (!/^[A-Za-z0-9_-]+$/.test(txnid)) {
            alert('Transaction ID can only contain letters, numbers, underscores, and hyphens.');
            if (txnidDisplay) txnidDisplay.focus();
            return false;
        }
        
        if (txnid.length > 25) {
            alert('Transaction ID cannot exceed 25 characters.');
            if (txnidDisplay) txnidDisplay.focus();
            return false;
        }
    } else {
        const txnid = document.getElementById(prefix + '_txnid')?.value;
        if (!txnid) {
            alert('Transaction ID is missing. Please refresh the page.');
            return false;
        }
    }
    
    // Common required fields
    let requiredFields = ['amount', 'productinfo', 'firstname', 'email', 'phone'];
    
    // Flow-specific validation
    if (flow === 'split') {
        if (!validateSplitAmounts()) return false;
    } else if (flow === 'crossborder') {
        requiredFields.push('address1', 'city', 'state', 'country', 'zipcode', 'lastname');
        
        if (currentPaymentType === 'subscription') {
            requiredFields.push('billing_amount', 'payment_start_date', 'payment_end_date', 'billing_cycle', 'billing_interval');
            
            const billingAmountField = document.getElementById('cb_billing_amount');
            if (!billingAmountField?.value || parseFloat(billingAmountField.value) <= 0) {
                alert('Please enter a valid billing amount');
                billingAmountField?.focus();
                return false;
            }
            
            if (!validateSubscriptionStartDate('crossborder')) return false;
        } else {
            requiredFields.push('udf5_input');
        }
    } else if (flow === 'subscription') {
        requiredFields.push('billing_amount', 'payment_start_date', 'payment_end_date', 'billing_cycle', 'billing_interval');
        
        const billingAmountField = document.getElementById('sub_billing_amount');
        if (!billingAmountField?.value || parseFloat(billingAmountField.value) <= 0) {
            alert('Please enter a valid billing amount');
            billingAmountField?.focus();
            return false;
        }
        
        if (!validateSubscriptionStartDate('subscription')) return false;
    } else if (flow === 'tpv') {
        requiredFields.push('beneficiary_account', 'ifsc_code');
    } else if (flow === 'upiotm') {
        requiredFields.push('payment_start_date', 'payment_end_date');
        if (!validateUpiOtmStartDate()) return false;
        if (!validateUpiOtmDates()) return false;
    } else if (flow === 'preauth') {
        const paymethodCheckboxes = document.querySelectorAll('input[name="preauth_paymethod"]:checked');
        if (paymethodCheckboxes.length === 0) {
            alert('Please select at least one payment method for PreAuth flow');
            return false;
        }
    }
    
    // Check custom keys
    if (document.getElementById(prefix + '_use_custom_keys')?.checked) {
        const customKey = document.getElementById(prefix + '_custom_key')?.value;
        const customSalt = document.getElementById(prefix + '_custom_salt')?.value;
        if (!customKey || !customSalt) {
            alert('Please provide both custom merchant key and salt');
            return false;
        }
    }
    
    // Validate required fields
    for (const fieldName of requiredFields) {
        const fieldId = prefix + '_' + fieldName;
        const field = document.getElementById(fieldId);
        
        if (!field || !field.value.trim()) {
            alert('Please fill the required field: ' + fieldName.replace(/_/g, ' ').toUpperCase());
            field?.focus();
            return false;
        }
    }
    
    // Validate email and phone
    if (!validateEmail(flow) || !validatePhone(flow)) {
        return false;
    }
    
    return true;
}

// ============================================
// PAYMENT SUBMISSION
// ============================================

/**
 * Submit payment
 * @param {string} flow - Flow identifier
 */
function submitPayment(flow) {
    console.log('=== Submitting Payment ===');
    
    if (flow === 'split') {
        regenerateSplitChildTransactionIds();
    }
    
    if (!validateForm(flow)) return;
    
    const prefix = getFlowPrefix(flow);
    const hashData = generateHash(flow);
    
    // Create dynamic form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://test.payu.in/_payment';
    form.style.display = 'none';
    
    const fields = [
        { name: 'key', value: hashData.credentials.key },
        { name: 'txnid', value: document.getElementById(prefix + '_txnid').value },
        { name: 'amount', value: document.getElementById(prefix + '_amount').value },
        { name: 'productinfo', value: document.getElementById(prefix + '_productinfo').value },
        { name: 'firstname', value: document.getElementById(prefix + '_firstname').value },
        { name: 'email', value: document.getElementById(prefix + '_email').value },
        { name: 'phone', value: document.getElementById(prefix + '_phone').value },
        { name: 'surl', value: document.getElementById(prefix + '_surl').value },
        { name: 'furl', value: document.getElementById(prefix + '_furl').value },
        { name: 'hash', value: hashData.hash }
    ];
    
    // Add optional fields
    const lastname = document.getElementById(prefix + '_lastname');
    if (lastname?.value) fields.push({ name: 'lastname', value: lastname.value });
    
    ['address1', 'address2', 'city', 'state', 'country', 'zipcode'].forEach(fieldName => {
        const field = document.getElementById(prefix + '_' + fieldName);
        if (field?.value) fields.push({ name: fieldName, value: field.value });
    });
    
    // Add UDF fields
    if (hashData.udf1) fields.push({ name: 'udf1', value: hashData.udf1 });
    if (hashData.udf2) fields.push({ name: 'udf2', value: hashData.udf2 });
    if (hashData.udf3) fields.push({ name: 'udf3', value: hashData.udf3 });
    if (hashData.udf4) fields.push({ name: 'udf4', value: hashData.udf4 });
    if (hashData.udf5) fields.push({ name: 'udf5', value: hashData.udf5 });
    
    // Flow-specific fields
    if (flow === 'crossborder' && currentPaymentType === 'subscription') {
        fields.push({ name: 'si', value: '1' });
        fields.push({ name: 'api_version', value: '7' });
        fields.push({ name: 'si_details', value: document.getElementById('cb_si_details').value });
        const buyerType = document.getElementById('cb_buyer_type')?.value;
        if (buyerType) fields.push({ name: 'buyer_type_business', value: buyerType });
    }
    
    if (flow === 'crossborder' && currentPaymentType === 'onetime') {
        const buyerType = document.getElementById('cb_buyer_type')?.value;
        if (buyerType) fields.push({ name: 'buyer_type_business', value: buyerType });
    }
    
    if (flow === 'subscription') {
        fields.push({ name: 'si', value: '1' });
        fields.push({ name: 'api_version', value: '7' });
        fields.push({ name: 'si_details', value: document.getElementById('sub_si_details').value });
    }
    
    if (flow === 'tpv') {
        fields.push({ name: 'api_version', value: '6' });
        fields.push({ name: 'beneficiarydetail', value: document.getElementById('tpv_beneficiarydetail').value });
    }
    
    if (flow === 'upiotm') {
        fields.push({ name: 'api_version', value: '7' });
        fields.push({ name: 'si_details', value: document.getElementById('upi_si_details').value });
        fields.push({ name: 'pre_authorize', value: '1' });
    }
    
    if (flow === 'preauth') {
        fields.push({ name: 'pre_authorize', value: '1' });
    }
    
    if (flow === 'split') {
        fields.push({ name: 'splitRequest', value: hashData.splitRequest });
    }
    
    if (flow === 'bankoffer') {
        const cartDetails = buildBankOfferCartDetails();
        if (cartDetails) {
            fields.push({ name: 'cart_details', value: cartDetails });
            fields.push({ name: 'api_version', value: '19' });
        }
        const offerKey = document.getElementById('bo_offer_key')?.value.trim();
        if (offerKey) fields.push({ name: 'offer_key', value: offerKey });
        const userToken = document.getElementById('bo_user_token')?.value.trim();
        if (userToken) fields.push({ name: 'user_token', value: userToken });
    }
    
    // Add enforce_paymethod
    const paymethodCheckboxes = document.querySelectorAll('input[name="' + prefix + '_paymethod"]:checked');
    if (paymethodCheckboxes.length > 0) {
        const selectedPaymethods = [];
        paymethodCheckboxes.forEach(checkbox => {
            const id = checkbox.id.replace(prefix + '_', '');
            let paymethodValue;
            
            if ((flow === 'crossborder' && currentPaymentType === 'subscription') || flow === 'subscription') {
                paymethodValue = { 'nb': 'enach', 'cc': 'creditcard', 'dc': 'debitcard', 'upi': 'upi' }[id] || checkbox.value.toLowerCase();
            } else {
                paymethodValue = { 'nb': 'netbanking', 'cc': 'creditcard', 'dc': 'debitcard', 'upi': 'upi' }[id] || checkbox.value.toLowerCase();
            }
            selectedPaymethods.push(paymethodValue);
        });
        fields.push({ name: 'enforce_paymethod', value: selectedPaymethods.join('|') });
    }
    
    // Create hidden inputs
    fields.forEach(field => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = field.name;
        input.value = field.value;
        form.appendChild(input);
    });
    
    // Submit form
    document.body.appendChild(form);
    form.target = '_blank';
    form.submit();
}

// ============================================
// DEBUG AND CURL FUNCTIONS
// ============================================

/**
 * Hide debug and CURL sections
 * @param {string} flow - Flow identifier
 */
function hideDebugAndCurl(flow) {
    const prefix = getFlowPrefix(flow);
    const debugSection = document.getElementById(prefix + '-debugSection');
    const curlSection = document.getElementById(prefix + '-curlSection');
    if (debugSection) debugSection.style.display = 'none';
    if (curlSection) curlSection.style.display = 'none';
}

/**
 * Reset form fields (refresh page)
 * @param {string} flow - Flow identifier
 */
function resetFormFields(flow) {
    const confirmed = confirm('Generate New Payment\n\nThis will refresh the page and generate a new Transaction ID.\n\nCurrent data will be cleared. Do you want to continue?');
    
    if (confirmed) {
        window.location.reload();
    }
}

/**
 * Show debug info
 * @param {string} flow - Flow identifier
 */
function showDebugInfo(flow) {
    if (flow === 'split') {
        regenerateSplitChildTransactionIds();
    }
    
    if (!validateForm(flow)) return;
    
    const prefix = getFlowPrefix(flow);
    const hashData = generateHash(flow);
    
    let debugHtml = '<table class="debug-table">';
    debugHtml += '<tr><th>Parameter</th><th>Value</th></tr>';
    debugHtml += '<tr><td>Flow</td><td>' + flow.toUpperCase() + '</td></tr>';
    debugHtml += '<tr><td>Endpoint</td><td>https://test.payu.in/_payment</td></tr>';
    
    debugHtml += '<tr style="background: #e6f7ff;"><td colspan="2"><strong>REQUEST BODY PARAMETERS</strong></td></tr>';
    debugHtml += '<tr><td>key</td><td>' + escapeHtml(hashData.credentials.key) + '</td></tr>';
    debugHtml += '<tr><td>txnid</td><td>' + escapeHtml(document.getElementById(prefix + '_txnid').value) + '</td></tr>';
    debugHtml += '<tr><td>amount</td><td>' + escapeHtml(document.getElementById(prefix + '_amount').value) + '</td></tr>';
    debugHtml += '<tr><td>productinfo</td><td>' + escapeHtml(document.getElementById(prefix + '_productinfo').value) + '</td></tr>';
    debugHtml += '<tr><td>firstname</td><td>' + escapeHtml(document.getElementById(prefix + '_firstname').value) + '</td></tr>';
    debugHtml += '<tr><td>email</td><td>' + escapeHtml(document.getElementById(prefix + '_email').value) + '</td></tr>';
    debugHtml += '<tr><td>phone</td><td>' + escapeHtml(document.getElementById(prefix + '_phone').value) + '</td></tr>';
    debugHtml += '<tr><td>surl</td><td>' + escapeHtml(document.getElementById(prefix + '_surl').value) + '</td></tr>';
    debugHtml += '<tr><td>furl</td><td>' + escapeHtml(document.getElementById(prefix + '_furl').value) + '</td></tr>';
    debugHtml += '<tr><td>hash</td><td>' + escapeHtml(hashData.hash.substring(0, 20)) + '... (truncated)</td></tr>';
    
    debugHtml += '</table>';
    
    debugHtml += '<h4>Hash Formula:</h4>';
    debugHtml += '<div class="hash-string-display" style="background: #fff3cd; border-color: #ffc107; color: #856404;">' + escapeHtml(hashData.hashFormula) + '</div>';
    
    debugHtml += '<h4>Generated Hash:</h4>';
    debugHtml += '<div class="hash-output">' + escapeHtml(hashData.hash) + '</div>';
    
    document.getElementById(prefix + '-debugContent').innerHTML = debugHtml;
    document.getElementById(prefix + '-debugSection').style.display = 'block';
    document.getElementById(prefix + '-debugSection').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Show CURL command
 * @param {string} flow - Flow identifier
 */
function showCurlCommand(flow) {
    if (flow === 'split') {
        regenerateSplitChildTransactionIds();
    }
    
    if (!validateForm(flow)) return;
    
    const prefix = getFlowPrefix(flow);
    const hashData = generateHash(flow);
    
    let curlCommand = 'curl -X POST "https://test.payu.in/_payment" \\\n';
    curlCommand += '  -H "Content-Type: application/x-www-form-urlencoded" \\\n';
    curlCommand += '  -d "key=' + hashData.credentials.key + '" \\\n';
    curlCommand += '  -d "txnid=' + document.getElementById(prefix + '_txnid').value + '" \\\n';
    curlCommand += '  -d "amount=' + document.getElementById(prefix + '_amount').value + '" \\\n';
    curlCommand += '  -d "productinfo=' + document.getElementById(prefix + '_productinfo').value + '" \\\n';
    curlCommand += '  -d "firstname=' + document.getElementById(prefix + '_firstname').value + '" \\\n';
    curlCommand += '  -d "email=' + document.getElementById(prefix + '_email').value + '" \\\n';
    curlCommand += '  -d "phone=' + document.getElementById(prefix + '_phone').value + '" \\\n';
    curlCommand += '  -d "surl=' + document.getElementById(prefix + '_surl').value + '" \\\n';
    curlCommand += '  -d "furl=' + document.getElementById(prefix + '_furl').value + '" \\\n';
    curlCommand += '  -d "hash=' + hashData.hash + '"';
    
    document.getElementById(prefix + '-curlContent').textContent = curlCommand;
    document.getElementById(prefix + '-curlSection').style.display = 'block';
    document.getElementById(prefix + '-curlSection').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Copy CURL to clipboard
 * @param {string} flow - Flow identifier
 */
function copyCurlToClipboard(flow) {
    const prefix = getFlowPrefix(flow);
    const curlContent = document.getElementById(prefix + '-curlContent')?.textContent;
    
    navigator.clipboard.writeText(curlContent).then(function() {
        alert('CURL command copied to clipboard!');
    }).catch(function(err) {
        console.error('Failed to copy CURL:', err);
        alert('Failed to copy. Please copy manually.');
    });
}

// ============================================
// CHECKOUT PLUS FUNCTIONS
// ============================================

/**
 * Launch Checkout Plus payment
 */
function launchCheckoutPlus() {
    if (!validateForm('checkoutplus')) return;
    
    if (typeof bolt === 'undefined') {
        alert('Checkout Plus SDK is not loaded. Please refresh the page.');
        return;
    }
    
    const prefix = 'cp';
    const credentials = getCredentials('checkoutplus');
    const hashData = generateHash('checkoutplus');
    
    const paymentData = {
        key: credentials.key,
        txnid: document.getElementById(prefix + '_txnid').value,
        amount: document.getElementById(prefix + '_amount').value,
        productinfo: document.getElementById(prefix + '_productinfo').value,
        firstname: document.getElementById(prefix + '_firstname').value,
        email: document.getElementById(prefix + '_email').value,
        phone: document.getElementById(prefix + '_phone').value,
        surl: document.getElementById(prefix + '_surl').value,
        furl: document.getElementById(prefix + '_furl').value,
        hash: hashData.hash
    };
    
    // Add optional fields
    const lastname = document.getElementById(prefix + '_lastname')?.value;
    if (lastname) paymentData.lastname = lastname;
    
    if (hashData.udf1) paymentData.udf1 = hashData.udf1;
    if (hashData.udf2) paymentData.udf2 = hashData.udf2;
    if (hashData.udf3) paymentData.udf3 = hashData.udf3;
    if (hashData.udf4) paymentData.udf4 = hashData.udf4;
    if (hashData.udf5) paymentData.udf5 = hashData.udf5;
    
    const handlers = {
        responseHandler: function(BOLT) {
            checkoutPlusResponseHandler(BOLT);
        },
        catchException: function(BOLT) {
            checkoutPlusCatchException(BOLT);
        }
    };
    
    try {
        bolt.launch(paymentData, handlers);
    } catch (error) {
        console.error('Error launching Checkout Plus:', error);
        alert('Failed to launch Checkout Plus: ' + error.message);
    }
}

/**
 * Checkout Plus response handler
 * @param {Object} BOLT - BOLT response object
 */
function checkoutPlusResponseHandler(BOLT) {
    console.log('=== Checkout Plus Response ===');
    console.log('Response:', BOLT.response);
    
    const res = BOLT.response;
    let message = '=== CHECKOUT PLUS RESPONSE ===\n\n';
    message += 'Status: ' + (res.txnStatus || 'UNKNOWN') + '\n';
    message += 'Transaction ID: ' + (res.txnId || res.txnid || 'N/A') + '\n';
    
    if (res.txnStatus === 'CANCEL') {
        message += 'Message: Transaction cancelled\n';
    } else if (res.txnStatus === 'SUCCESS') {
        message += '** Payment Successful! **\n';
    }
    
    alert(message);
}

/**
 * Checkout Plus exception handler
 * @param {Object} BOLT - BOLT exception object
 */
function checkoutPlusCatchException(BOLT) {
    console.log('=== Checkout Plus Exception ===');
    console.log('Message:', BOLT.message);
    alert('Payment Error: ' + BOLT.message);
}

