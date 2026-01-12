declare module 'react-native-version-check' {
  interface UpdateNeeded {
    isNeeded: boolean;
    storeUrl?: string;
    currentVersion?: string;
    latestVersion?: string;
  }

  interface VersionCheck {
    needUpdate(): Promise<UpdateNeeded | null>;
    getStoreUrl(): Promise<string | null>;
    getCurrentVersion(): string;
    getLatestVersion(): Promise<string>;
  }

  const VersionCheck: VersionCheck;
  export default VersionCheck;
}