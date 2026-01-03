import { StorageUtils } from '@/utils/storage';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export const StorageTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('Testing...');

  useEffect(() => {
    const runTest = async () => {
      try {
        // Test basic storage
        StorageUtils.set('test_key', { message: 'Hello Storage!' });
        const retrieved = StorageUtils.get('test_key');
        
        // Test cache with TTL
        StorageUtils.setCache('test_cache', { data: 'Cached data' }, 5000); // 5 seconds
        const cached = StorageUtils.getCache('test_cache');
        
        if (retrieved?.message === 'Hello Storage!' && cached?.data === 'Cached data') {
          setTestResult('✅ Storage system working correctly');
        } else {
          setTestResult('❌ Storage test failed');
        }
        
        // Clean up
        StorageUtils.remove('test_key');
      } catch (error) {
        setTestResult(`❌ Storage error: ${error}`);
      }
    };

    runTest();
  }, []);

  return (
    <View style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.1)', margin: 10, borderRadius: 5 }}>
      <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>
        {testResult}
      </Text>
    </View>
  );
};