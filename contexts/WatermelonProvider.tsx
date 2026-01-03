import { asyncStorageDB, database, DatabaseUtils, isWatermelonAvailable } from '@/database';
import { Database } from '@nozbe/watermelondb';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface WatermelonContextType {
  database: Database | typeof asyncStorageDB;
  isReady: boolean;
  isWatermelonAvailable: boolean;
  stats: any;
  unsyncedCount: any;
  refreshStats: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const WatermelonContext = createContext<WatermelonContextType | null>(null);

export const useWatermelon = () => {
  const context = useContext(WatermelonContext);
  if (!context) {
    throw new Error('useWatermelon must be used within WatermelonProvider');
  }
  return context;
};

interface WatermelonProviderProps {
  children: React.ReactNode;
}

export const WatermelonProvider: React.FC<WatermelonProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [unsyncedCount, setUnsyncedCount] = useState<any>({});

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      console.log('🔄 Initializing database system...');
      
      if (isWatermelonAvailable) {
        console.log('✅ Using WatermelonDB');
      } else {
        console.log('✅ Using AsyncStorage fallback');
        await asyncStorageDB.initialize();
      }
      
      // Load initial stats
      await refreshStats();
      setIsReady(true);
      
      console.log('✅ Database system ready');
    } catch (error) {
      console.error('❌ Failed to initialize database system:', error);
      // Still mark as ready to prevent app from hanging
      setIsReady(true);
    }
  };

  const refreshStats = async () => {
    try {
      const [dbStats, unsyncedStats] = await Promise.all([
        DatabaseUtils.getStats(),
        DatabaseUtils.getUnsyncedCount(),
      ]);
      
      setStats(dbStats);
      setUnsyncedCount(unsyncedStats);
    } catch (error) {
      console.error('❌ Failed to refresh stats:', error);
    }
  };

  const clearAll = async () => {
    try {
      await DatabaseUtils.clearAll();
      await refreshStats();
      console.log('🗑️ All data cleared');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
    }
  };

  const value: WatermelonContextType = {
    database: isWatermelonAvailable ? database! : asyncStorageDB,
    isReady,
    isWatermelonAvailable,
    stats,
    unsyncedCount,
    refreshStats,
    clearAll,
  };

  return (
    <WatermelonContext.Provider value={value}>
      {children}
    </WatermelonContext.Provider>
  );
};