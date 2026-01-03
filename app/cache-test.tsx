import { useTheme } from '@/contexts/ThemeContext';
import { StorageUtils } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const CacheTestScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [testResults, setTestResults] = useState<string[]>([]);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? "#0a0a0a" : "#FFFFFF",
    },
    text: {
      color: isDark ? "#FFFFFF" : "#000000",
    },
    card: {
      backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
      borderColor: isDark ? "#333333" : "#E0E0E0",
    },
  };

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runCacheTests = async () => {
    setTestResults([]);
    addResult('🧪 Starting cache tests...');

    try {
      // Test 1: Basic storage operations
      addResult('📝 Test 1: Basic storage operations');
      await StorageUtils.set('test_key', { message: 'Hello World', timestamp: Date.now() });
      const retrieved = await StorageUtils.get('test_key');
      addResult(retrieved ? '✅ Basic storage: PASSED' : '❌ Basic storage: FAILED');

      // Test 2: Cache with TTL
      addResult('📝 Test 2: Cache with TTL');
      await StorageUtils.setCache('cache_test', { data: 'cached_data' }, 5000); // 5 seconds TTL
      const cached = await StorageUtils.getCache('cache_test');
      addResult(cached ? '✅ Cache storage: PASSED' : '❌ Cache storage: FAILED');

      // Test 3: Offline storage
      addResult('📝 Test 3: Offline storage');
      await StorageUtils.setOffline('offline_test', { action: 'test_action', data: 'test_data' });
      const offline = await StorageUtils.getOffline('offline_test');
      addResult(offline ? '✅ Offline storage: PASSED' : '❌ Offline storage: FAILED');

      // Test 4: Get unsynced data
      addResult('📝 Test 4: Unsynced data retrieval');
      const unsyncedData = await StorageUtils.getUnsyncedOfflineData();
      addResult(`✅ Unsynced data: Found ${unsyncedData.length} items`);

      // Test 5: Clear operations
      addResult('📝 Test 5: Clear operations');
      await StorageUtils.remove('test_key');
      const afterRemove = await StorageUtils.get('test_key');
      addResult(!afterRemove ? '✅ Remove operation: PASSED' : '❌ Remove operation: FAILED');

      addResult('🎉 All tests completed!');
    } catch (error) {
      addResult(`❌ Test error: ${error}`);
    }
  };

  const clearAllCache = async () => {
    Alert.alert(
      'Clear All Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageUtils.clear();
              await StorageUtils.clearCache();
              await StorageUtils.clearOffline();
              addResult('🗑️ All cache cleared successfully');
            } catch (error) {
              addResult(`❌ Clear error: ${error}`);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    // Run tests on mount
    runCacheTests();
  }, []);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={dynamicStyles.text.color} />
        </Pressable>
        <Text style={[styles.headerTitle, dynamicStyles.text]}>
          Cache Test
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Test Controls */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Cache System Tests
          </Text>
          
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, { backgroundColor: '#4F46E5' }]}
              onPress={runCacheTests}
            >
              <Ionicons name="play" size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Run Tests</Text>
            </Pressable>
            
            <Pressable
              style={[styles.button, { backgroundColor: '#EF4444' }]}
              onPress={clearAllCache}
            >
              <Ionicons name="trash" size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Clear Cache</Text>
            </Pressable>
          </View>
        </View>

        {/* Test Results */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Test Results
          </Text>
          
          <View style={styles.resultsContainer}>
            {testResults.length === 0 ? (
              <Text style={[styles.noResults, { color: isDark ? "#9AA0A6" : "#666666" }]}>
                No test results yet. Run tests to see results.
              </Text>
            ) : (
              testResults.map((result, index) => (
                <Text
                  key={index}
                  style={[
                    styles.resultText,
                    {
                      color: result.includes('✅') 
                        ? '#10B981' 
                        : result.includes('❌') 
                        ? '#EF4444' 
                        : dynamicStyles.text.color
                    }
                  ]}
                >
                  {result}
                </Text>
              ))
            )}
          </View>
        </View>

        {/* Cache Info */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.cardTitle, dynamicStyles.text]}>
            Cache System Info
          </Text>
          
          <View style={styles.infoContainer}>
            <Text style={[styles.infoText, dynamicStyles.text]}>
              • Storage: AsyncStorage (React Native)
            </Text>
            <Text style={[styles.infoText, dynamicStyles.text]}>
              • Query Cache: TanStack Query
            </Text>
            <Text style={[styles.infoText, dynamicStyles.text]}>
              • Offline Support: Enabled
            </Text>
            <Text style={[styles.infoText, dynamicStyles.text]}>
              • Auto Sync: When online
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    gap: 4,
  },
  noResults: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  infoContainer: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default CacheTestScreen;