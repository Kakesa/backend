const axios = require('axios');

/**
 * MaishaPay Service for Mobile Money collections
 * Documentation: https://documenter.getpostman.com/view/22376672/2sAYQXnCU4
 */

const MAISHAPAY_BASE_URL = process.env.MAISHAPAY_BASE_URL || 'https://marchand.maishapay.online/api';
const API_KEY_PUBLIC = process.env.MAISHAPAY_PUBLIC_KEY;
const API_KEY_SECRET = process.env.MAISHAPAY_SECRET_KEY;
const GATEWAY_MODE = process.env.MAISHAPAY_MODE || '0'; // 0 for sandbox, 1 for live

/**
 * Initiate a Mobile Money collection
 * @param {Object} params 
 * @param {number} params.amount
 * @param {string} params.currency - CDF, USD, etc.
 * @param {string} params.phoneNumber - Format +243...
 * @param {string} params.provider - AIRTEL, ORANGE, M-PESA
 * @param {string} params.reference - Unique transaction ID
 * @param {string} params.callbackUrl - Webhook URL
 * @param {string} params.customerName - Optional
 */
const initiateCollection = async ({
    amount,
    currency,
    phoneNumber,
    provider,
    reference,
    callbackUrl,
    customerName
}) => {
    try {
        const payload = {
            gatewayMode: GATEWAY_MODE,
            publicApiKey: API_KEY_PUBLIC,
            secretApiKey: API_KEY_SECRET,
            transactionReference: reference,
            amount,
            currency,
            customerFullName: customerName || 'Parent Student',
            customerPhoneNumber: phoneNumber,
            channel: 'MOBILEMONEY',
            provider: provider.toUpperCase(),
            callbackUrl: callbackUrl
        };

        const response = await axios.post(`${MAISHAPAY_BASE_URL}/collect/v2/store/mobileMoney`, payload);

        // Typical successful response contains a status and sometimes a redirect or message
        return response.data;
    } catch (error) {
        console.error('MaishaPay Collection Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Erreur lors de l\'initiation du paiement MaishaPay');
    }
};

module.exports = {
    initiateCollection
};
