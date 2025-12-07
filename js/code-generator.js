/**
 * PayU Integration Lab - Code Generator
 * ======================================
 * Code generation functions for Java, PHP, Python, and Node.js
 */

// ============================================
// CODE GENERATOR MODAL FUNCTIONS
// ============================================

/**
 * Show code generator modal
 * @param {string} flow - Flow identifier
 */
function showCodeGeneratorModal(flow) {
    console.log('[DEBUG] showCodeGeneratorModal called with flow:', flow);
    
    if (flow === 'split') {
        regenerateSplitChildTransactionIds();
    }
    
    if (!validateForm(flow)) {
        return;
    }
    
    currentGeneratedFlow = flow;
    currentGeneratedLanguage = 'java';
    currentGeneratedParams = extractFlowParameters(flow);
    
    // Update modal title
    const flowNames = {
        'nonseamless': 'Pre-built Checkout',
        'crossborder': 'Cross Border',
        'subscription': 'Subscription',
        'tpv': 'TPV',
        'upiotm': 'UPI OTM',
        'preauth': 'PreAuth',
        'checkoutplus': 'Checkout Plus',
        'split': 'Split Payment',
        'bankoffer': 'Bank Offers'
    };
    
    const flowNameElement = document.getElementById('codeFlowName');
    if (flowNameElement) {
        flowNameElement.textContent = flowNames[flow] || flow;
    }
    
    // Generate and display code
    generateAndDisplayCode(flow, 'java');
    
    // Show modal
    const modal = document.getElementById('codeGeneratorModal');
    if (modal) {
        modal.style.display = 'flex';
    }
    
    console.log('Code generator modal opened for flow:', flow);
}

/**
 * Close code generator modal
 */
function closeCodeGeneratorModal() {
    const modal = document.getElementById('codeGeneratorModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentGeneratedFlow = '';
    currentGeneratedParams = {};
}

/**
 * Switch code language
 * @param {string} language - Target language
 */
function switchCodeLanguage(language) {
    currentGeneratedLanguage = language;
    
    // Update active tab
    document.querySelectorAll('.code-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Generate and display code
    generateAndDisplayCode(currentGeneratedFlow, language);
}

/**
 * Copy generated code to clipboard
 */
function copyGeneratedCode() {
    const codeElement = document.getElementById('generatedCodePreview');
    if (!codeElement) return;
    
    const code = codeElement.textContent;
    navigator.clipboard.writeText(code).then(function() {
        alert('Code copied to clipboard successfully!');
    }).catch(function(err) {
        console.error('Failed to copy code:', err);
        alert('Failed to copy code. Please copy manually.');
    });
}

/**
 * Download generated code
 */
function downloadGeneratedCode() {
    const codeElement = document.getElementById('generatedCodePreview');
    if (!codeElement) return;
    
    const code = codeElement.textContent;
    const extensions = {
        'java': 'java',
        'php': 'php',
        'python': 'py',
        'nodejs': 'js'
    };
    const ext = extensions[currentGeneratedLanguage] || 'txt';
    const filename = `PayUIntegration.${ext}`;
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Code downloaded as:', filename);
}

// ============================================
// PARAMETER EXTRACTION
// ============================================

/**
 * Extract flow parameters for code generation
 * @param {string} flow - Flow identifier
 * @returns {Object} Parameters object
 */
function extractFlowParameters(flow) {
    const prefix = getFlowPrefix(flow);
    
    const params = {
        txnid: document.getElementById(prefix + '_txnid')?.value || '',
        amount: document.getElementById(prefix + '_amount')?.value || '',
        productinfo: document.getElementById(prefix + '_productinfo')?.value || '',
        firstname: document.getElementById(prefix + '_firstname')?.value || '',
        email: document.getElementById(prefix + '_email')?.value || '',
        phone: document.getElementById(prefix + '_phone')?.value || '',
        surl: document.getElementById(prefix + '_surl')?.value || 'https://test.payu.in/admin/test_response',
        furl: document.getElementById(prefix + '_furl')?.value || 'https://test.payu.in/admin/test_response'
    };
    
    // Optional fields
    const optionalFields = ['lastname', 'address1', 'address2', 'city', 'state', 'country', 'zipcode'];
    optionalFields.forEach(field => {
        const value = document.getElementById(prefix + '_' + field)?.value;
        if (value) params[field] = value;
    });
    
    // UDF fields
    for (let i = 1; i <= 5; i++) {
        let udf = null;
        if (flow === 'crossborder' && currentPaymentType === 'subscription') {
            udf = document.getElementById('cb_sub_udf' + i + '_input')?.value;
        }
        if (!udf) udf = document.getElementById(prefix + '_udf' + i + '_input')?.value;
        if (!udf) udf = document.getElementById(prefix + '_udf' + i)?.value;
        if (udf) params['udf' + i] = udf;
    }
    
    // Flow-specific parameters
    const flowSpecific = {};
    
    if (flow === 'subscription' || (flow === 'crossborder' && currentPaymentType === 'subscription')) {
        flowSpecific.billingAmount = document.getElementById(prefix + '_billing_amount')?.value;
        flowSpecific.billingCycle = document.getElementById(prefix + '_billing_cycle')?.value;
        flowSpecific.billingInterval = document.getElementById(prefix + '_billing_interval')?.value;
        flowSpecific.paymentStartDate = document.getElementById(prefix + '_payment_start_date')?.value;
        flowSpecific.paymentEndDate = document.getElementById(prefix + '_payment_end_date')?.value;
        flowSpecific.hasSubscription = true;
    }
    
    if (flow === 'tpv') {
        flowSpecific.beneficiaryAccount = document.getElementById('tpv_beneficiary_account')?.value || '';
        flowSpecific.ifscCode = document.getElementById('tpv_ifsc_code')?.value || '';
        flowSpecific.hasBeneficiary = true;
    }
    
    if (flow === 'upiotm') {
        flowSpecific.paymentStartDate = document.getElementById('upi_payment_start_date')?.value;
        flowSpecific.paymentEndDate = document.getElementById('upi_payment_end_date')?.value;
        flowSpecific.hasUPIOTM = true;
    }
    
    if (flow === 'preauth') {
        flowSpecific.isPreauth = true;
        params.pre_authorize = '1';
    }
    
    if (flow === 'split') {
        const splitType = document.querySelector('input[name="split_type"]:checked')?.value || 'absolute';
        const splitRows = document.querySelectorAll('.split-row');
        const splitMerchants = [];
        
        splitRows.forEach(row => {
            const merchantKey = row.querySelector('.split-merchant-key')?.value.trim();
            const txnId = row.querySelector('.split-txn-id')?.value.trim();
            const amount = row.querySelector('.split-amount')?.value.trim();
            const charges = row.querySelector('.split-charges')?.value.trim() || '0.00';
            
            if (merchantKey && txnId && amount) {
                splitMerchants.push({ merchantKey, txnId, amount, charges });
            }
        });
        
        flowSpecific.hasSplit = true;
        flowSpecific.splitType = splitType;
        flowSpecific.splitMerchants = splitMerchants;
    }
    
    if (flow === 'bankoffer') {
        const offerKey = document.getElementById('bo_offer_key')?.value;
        const skuEnabled = document.getElementById('bo_enable_sku')?.checked;
        const userToken = document.getElementById('bo_user_token')?.value.trim();
        
        flowSpecific.hasBankOffer = true;
        if (offerKey) flowSpecific.offerKey = offerKey;
        if (userToken) params.user_token = userToken;
        
        if (skuEnabled) {
            const cartDetailsJson = document.getElementById('bo-json-preview')?.textContent;
            if (cartDetailsJson && cartDetailsJson.trim()) {
                flowSpecific.cartDetails = cartDetailsJson;
                flowSpecific.hasCartDetails = true;
            }
        }
    }
    
    if (flow === 'crossborder') {
        const buyerType = document.getElementById('cb_buyer_type')?.value;
        if (buyerType !== '') {
            flowSpecific.buyerTypeBusiness = buyerType;
        }
    }
    
    params._flow = flow;
    params._flowSpecific = flowSpecific;
    
    return params;
}

// ============================================
// CODE GENERATION
// ============================================

/**
 * Generate and display code
 * @param {string} flow - Flow identifier
 * @param {string} language - Target language
 */
function generateAndDisplayCode(flow, language) {
    let code = '';
    
    switch(language) {
        case 'java':
            code = generateJavaCode(flow, currentGeneratedParams);
            break;
        case 'php':
            code = generatePHPCode(flow, currentGeneratedParams);
            break;
        case 'python':
            code = generatePythonCode(flow, currentGeneratedParams);
            break;
        case 'nodejs':
            code = generateNodeJSCode(flow, currentGeneratedParams);
            break;
    }
    
    const preview = document.getElementById('generatedCodePreview');
    if (preview) {
        preview.textContent = code;
    }
}

/**
 * Get hash type for a flow
 * @param {string} flow - Flow identifier
 * @param {Object} flowSpec - Flow-specific parameters
 * @returns {string} Hash type
 */
function getHashType(flow, flowSpec) {
    if (flowSpec.hasSubscription && flowSpec.buyerTypeBusiness !== undefined) {
        return 'crossborder_subscription';
    }
    if (flowSpec.hasSubscription) return 'subscription';
    if (flowSpec.hasBeneficiary) return 'tpv';
    if (flowSpec.hasUPIOTM) return 'upiotm';
    if (flowSpec.hasSplit) return 'split';
    if (flowSpec.hasCartDetails) return 'bankoffer_sku';
    if (flowSpec.hasBankOffer) return 'bankoffer_standard';
    if (flowSpec.buyerTypeBusiness !== undefined) return 'crossborder';
    return 'standard';
}

/**
 * Generate Java code
 * @param {string} flow - Flow identifier
 * @param {Object} params - Parameters
 * @returns {string} Generated code
 */
function generateJavaCode(flow, params) {
    const flowSpec = params._flowSpecific || {};
    const hashType = getHashType(flow, flowSpec);
    const flowName = flow.charAt(0).toUpperCase() + flow.slice(1);
    
    // Build params string
    const paramsStr = Object.entries(params)
        .filter(([key]) => !key.startsWith('_') && key !== 'txnid')
        .map(([key, value]) => {
            const escaped = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            return `        params.put("${key}", "${escaped}");`;
        })
        .join('\n');
    
    return `import java.security.MessageDigest;
import java.util.*;

/**
 * PayU Integration - ${flowName} Flow
 * Generated by PayU Payment Hub
 * Hash Type: ${hashType}
 */
public class PayUIntegration {
    
    private static final String MERCHANT_KEY = "YOUR_MERCHANT_KEY";
    private static final String MERCHANT_SALT = "YOUR_MERCHANT_SALT";
    private static final String PAYU_URL = "https://test.payu.in/_payment";
    
    public static String generateTransactionId() {
        return "TXN" + System.currentTimeMillis() + (int)(Math.random() * 10000);
    }
    
    public static String generateHash(Map<String, String> params) throws Exception {
        String hashString = MERCHANT_KEY + "|" +
                           params.get("txnid") + "|" +
                           params.get("amount") + "|" +
                           params.get("productinfo") + "|" +
                           params.get("firstname") + "|" +
                           params.get("email") + "|" +
                           params.getOrDefault("udf1", "") + "|" +
                           params.getOrDefault("udf2", "") + "|" +
                           params.getOrDefault("udf3", "") + "|" +
                           params.getOrDefault("udf4", "") + "|" +
                           params.getOrDefault("udf5", "") + "||||||" +
                           MERCHANT_SALT;
        
        MessageDigest md = MessageDigest.getInstance("SHA-512");
        byte[] hash = md.digest(hashString.getBytes("UTF-8"));
        
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
    
    public static void main(String[] args) {
        try {
            Map<String, String> params = new LinkedHashMap<>();
            params.put("key", MERCHANT_KEY);
            params.put("txnid", generateTransactionId());
${paramsStr}
            
            String hash = generateHash(params);
            params.put("hash", hash);
            
            System.out.println("=== PayU ${flowName} Payment ===");
            System.out.println("Transaction ID: " + params.get("txnid"));
            System.out.println("Hash: " + hash);
            System.out.println("\\nSubmit to: " + PAYU_URL);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`;
}

/**
 * Generate PHP code
 * @param {string} flow - Flow identifier
 * @param {Object} params - Parameters
 * @returns {string} Generated code
 */
function generatePHPCode(flow, params) {
    const flowSpec = params._flowSpecific || {};
    const hashType = getHashType(flow, flowSpec);
    const flowName = flow.charAt(0).toUpperCase() + flow.slice(1);
    
    const paramsArray = Object.entries(params)
        .filter(([key]) => !key.startsWith('_') && key !== 'txnid')
        .map(([key, value]) => {
            const escaped = String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            return `        '${key}' => '${escaped}',`;
        })
        .join('\n');
    
    return `<?php
/**
 * PayU Integration - ${flowName} Flow
 * Generated by PayU Payment Hub
 * Hash Type: ${hashType}
 */

define('MERCHANT_KEY', 'YOUR_MERCHANT_KEY');
define('MERCHANT_SALT', 'YOUR_MERCHANT_SALT');
define('PAYU_URL', 'https://test.payu.in/_payment');

function generateTransactionId() {
    return 'TXN' . round(microtime(true) * 1000) . rand(1000, 9999);
}

function generateHash($params) {
    $hashString = MERCHANT_KEY . '|' .
                  $params['txnid'] . '|' .
                  $params['amount'] . '|' .
                  $params['productinfo'] . '|' .
                  $params['firstname'] . '|' .
                  $params['email'] . '|' .
                  ($params['udf1'] ?? '') . '|' .
                  ($params['udf2'] ?? '') . '|' .
                  ($params['udf3'] ?? '') . '|' .
                  ($params['udf4'] ?? '') . '|' .
                  ($params['udf5'] ?? '') . '||||||' .
                  MERCHANT_SALT;
    
    return hash('sha512', $hashString);
}

$params = [
    'key' => MERCHANT_KEY,
    'txnid' => generateTransactionId(),
${paramsArray}
];

$hash = generateHash($params);
$params['hash'] = $hash;

echo "=== PayU ${flowName} Payment ===\\n";
echo "Transaction ID: " . $params['txnid'] . "\\n";
echo "Hash: " . $hash . "\\n";
echo "\\nSubmit to: " . PAYU_URL . "\\n";
?>`;
}

/**
 * Generate Python code
 * @param {string} flow - Flow identifier
 * @param {Object} params - Parameters
 * @returns {string} Generated code
 */
function generatePythonCode(flow, params) {
    const flowSpec = params._flowSpecific || {};
    const hashType = getHashType(flow, flowSpec);
    const flowName = flow.charAt(0).toUpperCase() + flow.slice(1);
    
    const paramsDict = Object.entries(params)
        .filter(([key]) => !key.startsWith('_') && key !== 'txnid')
        .map(([key, value]) => {
            const escaped = String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            return `        '${key}': '${escaped}',`;
        })
        .join('\n');
    
    return `#!/usr/bin/env python3
"""
PayU Integration - ${flowName} Flow
Generated by PayU Payment Hub
Hash Type: ${hashType}
"""

import hashlib
import time
import random

MERCHANT_KEY = 'YOUR_MERCHANT_KEY'
MERCHANT_SALT = 'YOUR_MERCHANT_SALT'
PAYU_URL = 'https://test.payu.in/_payment'

def generate_transaction_id():
    timestamp = int(time.time() * 1000)
    random_num = random.randint(1000, 9999)
    return f'TXN{timestamp}{random_num}'

def generate_hash(params):
    hash_string = (
        f"{MERCHANT_KEY}|"
        f"{params['txnid']}|"
        f"{params['amount']}|"
        f"{params['productinfo']}|"
        f"{params['firstname']}|"
        f"{params['email']}|"
        f"{params.get('udf1', '')}|"
        f"{params.get('udf2', '')}|"
        f"{params.get('udf3', '')}|"
        f"{params.get('udf4', '')}|"
        f"{params.get('udf5', '')}||||||"
        f"{MERCHANT_SALT}"
    )
    return hashlib.sha512(hash_string.encode('utf-8')).hexdigest()

if __name__ == '__main__':
    params = {
        'key': MERCHANT_KEY,
        'txnid': generate_transaction_id(),
${paramsDict}
    }
    
    hash_value = generate_hash(params)
    params['hash'] = hash_value
    
    print("=== PayU ${flowName} Payment ===")
    print(f"Transaction ID: {params['txnid']}")
    print(f"Hash: {hash_value}")
    print(f"\\nSubmit to: {PAYU_URL}")`;
}

/**
 * Generate Node.js code
 * @param {string} flow - Flow identifier
 * @param {Object} params - Parameters
 * @returns {string} Generated code
 */
function generateNodeJSCode(flow, params) {
    const flowSpec = params._flowSpecific || {};
    const hashType = getHashType(flow, flowSpec);
    const flowName = flow.charAt(0).toUpperCase() + flow.slice(1);
    
    const paramsObj = Object.entries(params)
        .filter(([key]) => !key.startsWith('_') && key !== 'txnid')
        .map(([key, value]) => {
            const escaped = String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            return `        ${key}: '${escaped}',`;
        })
        .join('\n');
    
    return `/**
 * PayU Integration - ${flowName} Flow
 * Generated by PayU Payment Hub
 * Hash Type: ${hashType}
 */

const crypto = require('crypto');

const MERCHANT_KEY = 'YOUR_MERCHANT_KEY';
const MERCHANT_SALT = 'YOUR_MERCHANT_SALT';
const PAYU_URL = 'https://test.payu.in/_payment';

function generateTransactionId() {
    return 'TXN' + Date.now() + Math.floor(Math.random() * 10000);
}

function generateHash(params) {
    const hashString = [
        MERCHANT_KEY,
        params.txnid,
        params.amount,
        params.productinfo,
        params.firstname,
        params.email,
        params.udf1 || '',
        params.udf2 || '',
        params.udf3 || '',
        params.udf4 || '',
        params.udf5 || '',
        '', '', '', '', '', '',
        MERCHANT_SALT
    ].join('|');
    
    return crypto.createHash('sha512').update(hashString).digest('hex');
}

const params = {
    key: MERCHANT_KEY,
    txnid: generateTransactionId(),
${paramsObj}
};

const hash = generateHash(params);
params.hash = hash;

console.log('=== PayU ${flowName} Payment ===');
console.log('Transaction ID:', params.txnid);
console.log('Hash:', hash);
console.log('\\nSubmit to:', PAYU_URL);`;
}

