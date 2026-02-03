// Test script to verify Google Places API is working
require('dotenv').config();

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

async function testPlacesAPI() {
    console.log('Testing Google Places API...\n');
    console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

    if (!API_KEY) {
        console.error('❌ ERROR: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY not found in .env file');
        return;
    }

    // Test Places Autocomplete API
    const testQuery = 'Gordon Beach Tel Aviv';
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(testQuery)}&key=${API_KEY}`;

    console.log('\nTesting Places Autocomplete API...');
    console.log('Query:', testQuery);

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log('\nResponse Status:', data.status);

        if (data.status === 'OK') {
            console.log('✅ SUCCESS! Places API is working correctly');
            console.log('\nFirst 3 suggestions:');
            data.predictions.slice(0, 3).forEach((pred, i) => {
                console.log(`  ${i + 1}. ${pred.description}`);
            });
        } else if (data.status === 'REQUEST_DENIED') {
            console.log('❌ ERROR: Places API is NOT enabled for this API key');
            console.log('\nError message:', data.error_message);
            console.log('\n📋 TO FIX THIS:');
            console.log('1. Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com');
            console.log('2. Click "ENABLE" button');
            console.log('3. Wait a few minutes for the change to propagate');
            console.log('4. Run this test again');
        } else {
            console.log('⚠️  Unexpected status:', data.status);
            console.log('Error message:', data.error_message || 'None');
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

testPlacesAPI();
