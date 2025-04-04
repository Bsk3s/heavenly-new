import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { testConnection, testVoiceConnection } from '../../services/chatService';

const TestConnection = () => {
  const [apiStatus, setApiStatus] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    setApiStatus(null);
    setVoiceStatus(null);

    try {
      // Test regular API connection
      const apiResult = await testConnection();
      console.log('API Test Result:', apiResult);
      setApiStatus('success');

      // Test voice connection
      const voiceResult = await testVoiceConnection();
      console.log('Voice Test Result:', voiceResult);
      setVoiceStatus('success');
    } catch (err) {
      console.error('Connection test error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Automatically run tests when component mounts
  useEffect(() => {
    runTests();
  }, []);

  return (
    <View style={{ padding: 20, marginTop: 20, backgroundColor: '#f5f5f5', borderRadius: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Backend Connection Test</Text>
      
      {loading && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <ActivityIndicator size="small" color="#0000ff" />
          <Text style={{ marginLeft: 10 }}>Testing connections...</Text>
        </View>
      )}
      
      {error && (
        <View style={{ padding: 10, backgroundColor: '#ffeeee', borderRadius: 5, marginBottom: 10 }}>
          <Text style={{ color: '#ff0000' }}>Error: {error}</Text>
        </View>
      )}
      
      <View style={{ marginBottom: 10 }}>
        <Text>API Connection: {
          apiStatus === 'success' 
            ? '✅ Connected' 
            : apiStatus === 'error' 
              ? '❌ Failed' 
              : 'Testing...'
        }</Text>
      </View>
      
      <View style={{ marginBottom: 10 }}>
        <Text>Voice Connection: {
          voiceStatus === 'success' 
            ? '✅ Connected' 
            : voiceStatus === 'error' 
              ? '❌ Failed' 
              : 'Testing...'
        }</Text>
      </View>
      
      <TouchableOpacity 
        onPress={runTests}
        style={{ 
          backgroundColor: '#3498db', 
          padding: 10, 
          borderRadius: 5,
          alignItems: 'center',
          opacity: loading ? 0.7 : 1
        }}
        disabled={loading}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {loading ? 'Testing...' : 'Test Connection Again'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default TestConnection; 